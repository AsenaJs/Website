---
title: Asena Drizzle
description: Type-safe database integration with Repository pattern for Asena
outline: deep
---

# Asena Drizzle

Drizzle ORM utilities for AsenaJS - A powerful and type-safe database integration package that provides generic Database services and Repository patterns.

## Features

- 🚀 **Generic Database Service** - Support for multiple database types
- 🎯 **Type-Safe Repository Pattern** - Full TypeScript type inference
- 🏷️ **Decorator-Based Configuration** - Easy setup with `@Database`, `@Repository`, `@Transaction`, and `@Drizzle`
- 🔄 **Declarative Transactions** - `@Transaction` with `REQUIRED` / `NESTED` / `REQUIRES_NEW` propagation, propagated through `AsyncLocalStorage`
- 🔧 **AsenaJS Integration** - Seamless IoC container integration
- 📦 **Multiple Database Support** - Connect to different databases simultaneously
- ⚡ **Performance Optimized** - Connection pooling and efficient queries

## Installation

```bash
# Core packages
bun add @asenajs/asena-drizzle drizzle-orm

# Database drivers
bun add pg              # For PostgreSQL
bun add mysql2          # For MySQL
```

**Requirements:**
- [Bun](https://bun.sh) v1.3.12 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.7.0 or higher
- [drizzle-orm](https://orm.drizzle.team) v0.44 or higher

## Supported Databases

- ✅ **PostgreSQL** - using `pg` (node-postgres) with connection pooling
- ✅ **MySQL** - using `mysql2`
- ✅ **BunSQL** - using Bun's built-in SQL interface
- ⏳ **SQLite** - coming soon

## Quick Start

### 1. Define Your Schema

```typescript
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});
```

### 2. Setup Database Service
```typescript
// database/schemas/index.ts
import * as User from '../schemas/user.schema.ts';

export default {
  ...User,
};
```



```typescript
import { Database, AsenaDatabaseService } from '@asenajs/asena-drizzle';

@Database({
  type: 'postgresql',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password',
  },
  name: 'MainDatabase' // Recommended: used for IoC registration
})
export class MyDatabase extends AsenaDatabaseService<BunSQLDatabase<typeof Schemas>> {}
```
::: tip 💡 Schema Export Pattern

We export all schemas as a single object for better TypeScript support:
```typescript
// database/schemas/index.ts
import * as User from './user.schema';
export default { ...User };
```

**Why?**
- ✅ Full IntelliSense in queries
- ✅ Type-safe column access
- ✅ Autocomplete for table names
- ✅ Compile-time error catching

**Usage:**
```typescript
export class MyDatabase extends AsenaDatabaseService<BunSQLDatabase<typeof Schemas>> {
  // Now you have full type safety! 🎉
}
```

This is Drizzle's recommended pattern for optimal developer experience.
:::


### 3. Create Repository

```typescript
import { Repository, BaseRepository } from '@asenajs/asena-drizzle';
import { eq } from 'drizzle-orm';

@Repository({
  table: users,
  databaseService: 'MainDatabase',
})
export class UserRepository extends BaseRepository<typeof users,BunSQLDatabase<typeof Schemas>> {
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }

  async findActiveUsers() {
    return this.findAll(eq(users.isActive, true));
  }
}
```

::: tip Type-Safe Repository Pattern
Always provide both generic parameters to your repository for full TypeScript support:
```typescript
// First parameter: Your table schema
// Second parameter: Your database connection type
export class UserRepository extends BaseRepository<typeof users, NodePgDatabase<typeof Schemas>> {
  // Now you have full IntelliSense and type checking!
}
```

**Why this matters:**
Without the database type parameter, TypeScript cannot infer the correct query builder methods, and you'll lose IDE autocomplete features.

**Available Database Types:**

| Database | Driver | Type to Use |
|----------|--------|-------------|
| PostgreSQL | `pg` | `NodePgDatabase<typeof Schemas>` |
| MySQL | `mysql2` | `MySql2Database<typeof Schemas>` |
| SQLite | `bun:sqlite` | `BunSQLDatabase<typeof Schemas>` |

**Complete Example:**
```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from './schema';

@Repository(users)
export class UserRepository extends BaseRepository<typeof users, NodePgDatabase<typeof Schemas>> {
  // Type-safe methods with IntelliSense
  async findByEmail(email: string) {
    return this.query().where(eq(users.email, email)).limit(1);
  }
}
```
:::

### 4. Activate the Transaction Post-Processor (optional)

If you plan to use `@Transaction` (see [Transactions](#transactions) below), drop a `@Drizzle`-decorated class somewhere in your source folder — `src/config/` is the convention. AsenaJS only scans your source files, never `node_modules`, so the transaction post-processor must be subclassed inside your project to be discovered.

```typescript
// src/config/AppDrizzle.ts
import { Drizzle, TransactionPostProcessor } from '@asenajs/asena-drizzle';

@Drizzle({ defaultDb: 'MainDatabase' })
export class AppDrizzle extends TransactionPostProcessor {}
```

The body is intentionally empty — this class exists only so AsenaJS's component scanner picks it up. Setting `defaultDb` lets every `@Transaction()` call site omit the `database` option in single-database projects.

::: tip Skip this step if you don't need transactions
The package works fine without `@Drizzle` — you'll still get repositories, the typed query builder, pagination, and `BaseRepository#transaction(cb)`. You only need this step to enable the `@Transaction` decorator.
:::

### 5. Use in Services

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Service('UserService')
export class UserService {
  @Inject('UserRepository')
  private userRepository: UserRepository;

  async createUser(name: string, email: string) {
    return this.userRepository.create({ name, email });
  }

  async getAllUsers() {
    return this.userRepository.findAll();
  }

  async getUsersPaginated(page = 1, limit = 10) {
    return this.userRepository.paginate(page, limit);
  }
}
```

## @Database Decorator API

The `@Database` decorator configures a database connection:

```typescript
@Database({
  type: 'postgresql' | 'mysql' | 'bun-sql',
  config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    connectionString?: string; // Optional: overrides individual config
    // PostgreSQL pool options (optional)
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  },
  name?: string; // Optional: service name (recommended for multiple databases)
  drizzleConfig?: {
    logger?: boolean; // Enable SQL query logging
    schema?: any;     // Your Drizzle schema
  }
})
```

## @Repository Decorator API

The `@Repository` decorator configures a repository:

```typescript
@Repository({
  table: DrizzleTable,        // Your Drizzle table schema (must have 'id' column)
  databaseService: string,    // Name of the @Database service
  name?: string               // Optional: service name (defaults to class name)
})
```

## @Drizzle Decorator API

`@Drizzle` activates the transaction post-processor (see [Step 4 of Quick Start](#4-activate-the-transaction-post-processor-optional)). Apply it to a class extending `TransactionPostProcessor` placed in your source folder:

```typescript
@Drizzle({
  defaultDb?: string;  // Optional: name of the @Database service used when
                       //           @Transaction() omits the `database` option
})
```

The decorator chains `@PostProcessor()` onto your subclass and writes the options as metadata, which `TransactionPostProcessor` reads at bootstrap. You can also apply it with no arguments (`@Drizzle()`) when you'd rather always specify `database` explicitly on each `@Transaction`.

## Database Configuration

### PostgreSQL

```typescript
@Database({
  type: 'postgresql',
  config: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',

    // Optional: Connection pool settings
    max: 20, // Maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  name: 'MainDatabase'
})
export class PostgresDB extends AsenaDatabaseService {}
```

### MySQL

```typescript
@Database({
  type: 'mysql',
  config: {
    host: 'localhost',
    port: 3306,
    database: 'myapp',
    user: 'root',
    password: 'password',
  },
  name: 'MySQLDB'
})
export class MySQLDatabase extends AsenaDatabaseService {}
```

### BunSQL

```typescript
@Database({
  type: 'bun-sql',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password',
  },
  name: 'BunSQLDB'
})
export class BunSQLDatabase extends AsenaDatabaseService {}
```

### Connection String

```typescript
@Database({
  type: 'postgresql',
  config: {
    connectionString: process.env.DATABASE_URL,
    // Still required (can be empty if using connection string)
    host: '',
    port: 0,
    database: '',
    user: '',
    password: ''
  },
  name: 'MainDatabase'
})
export class DatabaseFromURL extends AsenaDatabaseService {}
```

## Repository Methods

The `BaseRepository` provides a comprehensive set of CRUD methods:

### Finding Records

#### findById(id)

Find a record by its ID.

```typescript
const user = await userRepository.findById('123e4567-e89b-12d3-a456-426614174000');
```

#### findOne(where)

Find a single record matching the condition.

```typescript
import { eq } from 'drizzle-orm';

const user = await userRepository.findOne(eq(users.email, 'john@example.com'));
```

#### findAll(where?)

Find all records, optionally filtered.

```typescript
// All records
const allUsers = await userRepository.findAll();

// Filtered
const activeUsers = await userRepository.findAll(eq(users.isActive, true));
```

### Creating Records

#### create(data)

Create a single record.

```typescript
const newUser = await userRepository.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

#### createMany(data[])

Create multiple records at once.

```typescript
const newUsers = await userRepository.createMany([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]);
```

### Updating Records

#### updateById(id, data)

Update a record by ID.

```typescript
const updated = await userRepository.updateById(
  '123e4567-e89b-12d3-a456-426614174000',
  { name: 'John Updated' }
);
```

#### update(where, data)

Update records matching a condition.

```typescript
import { eq } from 'drizzle-orm';

await userRepository.update(
  eq(users.isActive, false),
  { isActive: true }
);
```

### Deleting Records

#### deleteById(id)

Delete a record by ID.

```typescript
await userRepository.deleteById('123e4567-e89b-12d3-a456-426614174000');
```

#### delete(where)

Delete records matching a condition.

```typescript
import { eq } from 'drizzle-orm';

await userRepository.delete(eq(users.isActive, false));
```

### Counting Records

#### count()

Count all records.

```typescript
const total = await userRepository.count();
```

#### countBy(where)

Count records matching a condition.

```typescript
import { eq } from 'drizzle-orm';

const activeCount = await userRepository.countBy(eq(users.isActive, true));
```

### Pagination

#### paginate(page, limit, where?, orderBy?)

Get paginated results.

```typescript
import { desc } from 'drizzle-orm';

const result = await userRepository.paginate(1, 10, undefined, desc(users.createdAt));

// result.data       - array of records
// result.total      - total count
// result.page       - current page
// result.limit      - items per page
// result.totalPages - total pages
```

::: tip Deterministic by default
When you do not provide `orderBy`, the repository falls back to `asc(table.id)` so rows do not interleave across pages. Pass an explicit `orderBy` whenever you need a different sort.
:::

### Existence Check

#### exists(where)

Check if a record exists.

```typescript
import { eq } from 'drizzle-orm';

const exists = await userRepository.exists(eq(users.email, 'john@example.com'));
```

### Field Shortcuts

These two helpers wrap the most common `eq(column, value)` lookups so you don't have to import `eq` from `drizzle-orm` for one-off checks. Both are fully type-safe — `field` must be a key of the row type, and `value` is constrained to that column's inferred type.

#### findBy(field, value)

Equivalent to `findAll(eq(table[field], value))`.

```typescript
const activeUsers = await userRepository.findBy('status', 'active');
```

#### existsBy(field, value)

Equivalent to `exists(eq(table[field], value))`.

```typescript
const taken = await userRepository.existsBy('email', 'john@example.com');
```

### Bulk Aliases

`updateMany` / `deleteMany` are semantic aliases of `update` / `delete` that respect the documented public API surface. They behave identically to their counterparts.

#### updateMany(where, data)

```typescript
import { eq } from 'drizzle-orm';

await userRepository.updateMany(eq(users.isActive, false), { isActive: true });
```

#### deleteMany(where)

```typescript
import { eq } from 'drizzle-orm';

const removedCount = await userRepository.deleteMany(eq(users.isActive, false));
```

### Programmatic Transaction

#### transaction(callback, options?)

Run `callback` inside a Drizzle transaction. When called from within an active `@Transaction` scope (see [Transactions](#transactions) below), it opens a `SAVEPOINT`; otherwise it starts a brand-new top-level transaction.

```typescript
await userRepository.transaction(async () => {
  await userRepository.create({ name: 'Ada', email: 'ada@example.com' });
  await profileRepository.create({ userId: 'ada-id', bio: '…' });
}, { isolationLevel: 'serializable' });
```

The optional second argument forwards `isolationLevel` and `accessMode` to Drizzle's `db.transaction(cb, config)`.

## Advanced Queries

### Complex Filtering

```typescript
import { eq, and, or, gt, lt, like } from 'drizzle-orm';

@Repository({ table: users, databaseService: 'MainDatabase' })
export class UserRepository extends BaseRepository<typeof users> {
  async findAdultActiveUsers() {
    return this.findAll(
      and(
        eq(users.isActive, true),
        gt(users.age, 18)
      )
    );
  }

  async searchUsers(query: string) {
    return this.findAll(
      or(
        like(users.name, `%${query}%`),
        like(users.email, `%${query}%`)
      )
    );
  }
}
```

### Joins and Relations

```typescript
import { pgTable, uuid, text, foreignKey } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
});

@Repository({ table: posts, databaseService: 'MainDatabase' })
export class PostRepository extends BaseRepository<typeof posts> {
  async findPostsWithAuthors() {
    const db = this.getDatabase();

    return db
      .select({
        post: posts,
        author: users
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id));
  }
}
```

### Raw Database Access

```typescript
@Repository({ table: users, databaseService: 'MainDatabase' })
export class UserRepository extends BaseRepository<typeof users> {
  async complexQuery() {
    const db = this.getDatabase();

    // Use Drizzle's full API
    return db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users.createdAt))
      .limit(10);
  }

  async rawSQL() {
    const db = this.getDatabase();

    // Execute raw SQL if needed
    return db.execute(sql`
      SELECT * FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
  }
}
```

## Multiple Databases

You can connect to multiple databases simultaneously:

```typescript
// Primary database
@Database({
  type: 'postgresql',
  config: { /* primary db config */ },
  name: 'PrimaryDB'
})
export class PrimaryDatabase extends AsenaDatabaseService {}

// Analytics database
@Database({
  type: 'mysql',
  config: { /* analytics db config */ },
  name: 'AnalyticsDB'
})
export class AnalyticsDatabase extends AsenaDatabaseService {}

// Use different databases
@Repository({ table: users, databaseService: 'PrimaryDB' })
export class UserRepository extends BaseRepository<typeof users> {}

@Repository({ table: events, databaseService: 'AnalyticsDB' })
export class EventRepository extends BaseRepository<typeof events> {}
```

## Transactions

asena-drizzle ships a Spring-style `@Transaction` decorator backed by Bun's native `AsyncLocalStorage`. Repository calls made inside a `@Transaction`-wrapped method automatically pick up the active transaction — you do not have to thread a `tx` parameter through your code.

::: warning Setup required
`@Transaction` only works once you have activated the post-processor with a `@Drizzle`-decorated class in your source folder — see [Step 4 of Quick Start](#4-activate-the-transaction-post-processor-optional). Without it the decorator silently does nothing because AsenaJS never sees the post-processor.
:::

### `@Transaction` Decorator

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Transaction } from '@asenajs/asena-drizzle';

@Service('AccountService')
export class AccountService {
  @Inject('UserRepository') 
  private userRepo: UserRepository;
    
  @Inject('AuditRepository') 
  private auditRepo: AuditRepository;

  // Uses defaultDb from @Drizzle({ defaultDb: 'MainDatabase' })
  @Transaction()
  async register(payload: { email: string; name: string }) {
    const user = await this.userRepo.create(payload);
    await this.auditRepo.create({ userId: user.id, event: 'register' });
    // Either both rows commit, or both roll back atomically.
    return user;
  }
}
```

When you have multiple `@Database` services, pass the target name explicitly — it overrides any `defaultDb`:

```typescript
@Transaction({ database: 'AnalyticsDB' })
async trackEvent(...) { ... }
```

If neither `@Drizzle.defaultDb` nor `@Transaction.database` is set, the post-processor fails fast at registration time with a descriptive error.

### Propagation Modes

| Mode | If a transaction is active | If no transaction is active |
|---|---|---|
| `REQUIRED` *(default)* | Joins the existing transaction (no new one is started). | Starts a new top-level transaction. |
| `NESTED` | Opens a `SAVEPOINT` inside the existing transaction. Inner failures roll back to the savepoint without aborting the outer transaction. | Starts a new top-level transaction. |
| `REQUIRES_NEW` | Suspends the outer transaction and runs in an independent top-level transaction (a fresh connection is taken from the pool). | Starts a new top-level transaction. |

```typescript
@Transaction({
  database: 'MainDatabase',
  propagation: 'NESTED',
  isolationLevel: 'serializable',
})
async bestEffortAudit(userId: string) {
  // Inner failure rolls back to a savepoint; the outer caller can keep going.
}

@Transaction({
  database: 'MainDatabase',
  propagation: 'REQUIRES_NEW',
})
async writeAuditLog(event: AuditEvent) {
  // Survives even if the surrounding transaction rolls back — useful for
  // audit/telemetry writes that must persist independently.
}
```

### Isolation & Access Mode

`isolationLevel` and `accessMode` are forwarded straight to Drizzle's `db.transaction(cb, config)`:

```typescript
@Transaction({
  database: 'MainDatabase',
  isolationLevel: 'repeatable read',
  accessMode: 'read only',
})
async snapshot() {
  // …
}
```

Supported values:

- `isolationLevel`: `'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable'`
- `accessMode`: `'read only' | 'read write'`

Dialects that don't recognize a given value silently ignore it (e.g. SQLite vs PostgreSQL).

### Programmatic Boundary

Use [`BaseRepository#transaction(callback, options?)`](#programmatic-transaction) when you need a transaction inside a single method without lifting the boundary up to a service-level decorator. It is ALS-aware: inside an active `@Transaction` scope it opens a `SAVEPOINT`, otherwise it starts a new top-level transaction.

### Raw Drizzle Escape Hatch

If you need access to Drizzle's full query builder inside a transaction (joins, raw SQL, dialect-specific helpers), reach for the underlying `db.transaction(...)`:

```typescript
@Service()
export class OrderService {
  @Inject('OrderRepository') 
  private orderRepo: OrderRepository;
  
  @Inject('InventoryRepository') 
  private inventoryRepo: InventoryRepository;

  async createOrder(items: Array<{ productId: string; quantity: number }>) {
    return this.orderRepo.db.transaction(async (tx) => {
      const order = await tx.insert(orders).values({
        total: 100,
        status: 'pending',
      }).returning();

      for (const item of items) {
        await tx.update(inventory)
          .set({ stock: sql`stock - ${item.quantity}` })
          .where(eq(inventory.productId, item.productId));
      }

      return order[0];
    });
  }
}
```

::: warning Self-invocation
`@Transaction` only wraps actual class methods. Arrow-function class properties (`run = async () => …`) live on the instance, not the prototype, and are not intercepted. Use the standard `async method() { … }` syntax.
:::

::: tip Roadmap — full auto-resolution
Today, single-database projects can use `@Drizzle({ defaultDb })` once and call `@Transaction()` with no arguments thereafter. Multi-database projects still need to name the target explicitly. Once AsenaJS core ships an `afterAllComponentsRegistered` post-processor hook (see [`docs/asena-core-feature-request-afterAllComponentsRegistered.md`](https://github.com/AsenaJs/asena-drizzle/blob/master/docs/asena-core-feature-request-afterAllComponentsRegistered.md) in the asena-drizzle repository), v1.3.0 will skip even the `defaultDb` step when exactly one `@Database` service is registered, mirroring Spring Boot's auto-wired repositories.
:::

## Best Practices

### 1. Use Repository Pattern

```typescript
// ✅ Good: Business logic in service, data access in repository
@Repository({ table: users, databaseService: 'MainDB' })
export class UserRepository extends BaseRepository<typeof users> {
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }
}

@Service()
export class UserService {
  @Inject(UserRepository)
  private userRepo: UserRepository;

  async createUser(data: any) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error('Email exists');

    return this.userRepo.create(data);
  }
}

// ❌ Bad: Direct database access in service
@Service()
export class UserService {
  async createUser(data: any) {
    const db = getDatabase();
    const existing = await db.select().from(users)...
  }
}
```

### 2. Type Safety

```typescript
// ✅ Good: Full type inference
const user = await userRepository.create({
  name: 'John',
  email: 'john@example.com'
});
// user.id, user.name, user.email are all typed!

// ❌ Bad: Losing type safety
const user: any = await userRepository.create({...});
```

### 3. Use Pagination for Large Datasets

```typescript
// ✅ Good: Paginated results
const page1 = await userRepository.paginate(1, 20);
const page2 = await userRepository.paginate(2, 20);

// ❌ Bad: Loading all records
const allUsers = await userRepository.findAll(); // Could be millions!
```

### 4. Custom Repository Methods

```typescript
// ✅ Good: Encapsulate complex queries
@Repository({ table: users, databaseService: 'MainDB' })
export class UserRepository extends BaseRepository<typeof users> {
  async findRecentActiveUsers(days: number = 7) {
    const db = this.getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          gt(users.lastLoginAt, cutoffDate)
        )
      );
  }
}
```

## Related Documentation

- [Services](/docs/concepts/services)
- [Dependency Injection](/docs/concepts/dependency-injection)
- [Configuration](/docs/guides/configuration)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

**Next Steps:**
- Set up your database schema
- Create repositories for your entities
- Learn about [Services](/docs/concepts/services)
- Explore [Testing](/docs/guides/testing) with repositories
