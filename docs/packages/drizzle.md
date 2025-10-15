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
- 🏷️ **Decorator-Based Configuration** - Easy setup with `@Database` and `@Repository`
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
export class MyDatabase extends AsenaDatabaseService {}
```

### 3. Create Repository

```typescript
import { Repository, BaseRepository } from '@asenajs/asena-drizzle';
import { eq } from 'drizzle-orm';

@Repository({
  table: users,
  databaseService: 'MainDatabase',
})
export class UserRepository extends BaseRepository<typeof users> {
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }

  async findActiveUsers() {
    return this.findAll(eq(users.isActive, true));
  }
}
```

### 4. Use in Services

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';

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

// result.data - array of records
// result.meta.total - total count
// result.meta.page - current page
// result.meta.limit - items per page
// result.meta.totalPages - total pages
```

### Existence Check

#### exists(where)

Check if a record exists.

```typescript
import { eq } from 'drizzle-orm';

const exists = await userRepository.exists(eq(users.email, 'john@example.com'));
```

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

```typescript
@Service()
export class OrderService {
  @Inject('OrderRepository')
  private orderRepo: OrderRepository;

  @Inject('InventoryRepository')
  private inventoryRepo: InventoryRepository;

  async createOrder(items: Array<{ productId: string; quantity: number }>) {
    const db = this.orderRepo.getDatabase();

    return db.transaction(async (tx) => {
      // Create order
      const order = await tx.insert(orders).values({
        total: 100,
        status: 'pending'
      }).returning();

      // Update inventory
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
