// Every tooltip text here was produced by the TypeScript language service against the published
// packages. Re-verify after an API change; a hover that lies is worse than none.

export interface HoverTip {
  text: string
  error?: boolean
}

export interface HoverSnippet {
  files: { name?: string; code: string }[]
  tips: Record<string, HoverTip>
}

// `⟦key|text⟧` marks a hover anchor; `key` picks the tip.
export const SNIPPETS: Record<string, HoverSnippet> = {
  'home-contract': {
    files: [
      {
        code: `import { Context } from '@asenajs/ergenecore'
import { z } from 'zod'

class CreateUserContext extends Context.define({
  body: z.object({
    name: z.string().trim(),
    age: z.coerce.number().default(18),
  }),
  query: z.object({
    notify: z.stringbool().default(false),
  }),
}) {}`,
      },
    ],
    tips: {},
  },

  'home-inferred': {
    files: [
      {
        name: 'user.controller.ts',
        code: `@Controller('/users')
export class UserController {
  @Post('/')
  async create(context: CreateUserContext) {
    const user = context.input.⟦body|body⟧
    const notify = context.input.query.⟦notify|notify⟧

    return context.send({ user, notify }, 201)
  }
}`,
      },
      {
        name: 'user.context.ts',
        code: `import { Context } from '@asenajs/ergenecore'
import { z } from 'zod'

class CreateUserContext extends Context.define({
  body: z.object({
    name: z.string().trim(),
    age: z.coerce.number().default(18),
  }),
  query: z.object({
    notify: z.stringbool().default(false),
  }),
}) {}`,
      },
    ],
    tips: {
      body: { text: '(property) body: {\n    name: string;\n    age: number;\n}' },
      notify: { text: '(property) notify: boolean' },
    },
  },

  'home-undeclared': {
    files: [
      {
        code: `@Get('/:id')
async find(context: CreateUserContext) {
  const { id } = context.input.⟦params|params⟧
}`,
      },
    ],
    tips: {
      params: {
        error: true,
        text: "Property 'params' does not exist on type\nReadonly<InferInputs<{ body: …; query: … }>>\nts(2339)",
      },
    },
  },

  'validation-input': {
    files: [
      {
        code: `class OrderContext extends Context.define({
  params: z.object({ id: z.coerce.number().int() }),
  query: z.object({
    since: z.iso.date().transform((s) => new Date(s)),
    tags: z.string().transform((s) => s.split(',')).optional(),
  }),
  headers: z.object({ 'x-tenant': z.enum(['eu', 'us']) }),
}) {}

@Controller('/orders')
export class OrderController {
  @Get('/:id')
  async find(context: OrderContext) {
    const { ⟦id|id⟧ } = context.input.⟦params|params⟧
    const ⟦since|since⟧ = context.input.query.since
    const ⟦tags|tags⟧ = context.input.query.tags
    const ⟦tenant|tenant⟧ = context.input.headers['x-tenant']
  }
}`,
      },
    ],
    tips: {
      id: { text: 'const id: number' },
      params: { text: '(property) params: {\n    id: number;\n}' },
      since: { text: 'const since: Date' },
      tags: { text: 'const tags: string[] | undefined' },
      tenant: { text: 'const tenant: "eu" | "us"' },
    },
  },

  'validation-typo': {
    files: [
      {
        code: `class CreateUserContext extends Context.define({
  ⟦bdoy|bdoy⟧: z.object({ name: z.string() }),
}) {}`,
      },
    ],
    tips: {
      bdoy: {
        error: true,
        text:
          "Object literal may only specify known properties, and 'bdoy'\ndoes not exist in type 'ExactRequestSchemas<…>'.\nts(2353)",
      },
    },
  },

  'drizzle-repository': {
    files: [
      {
        code: `@Service()
export class UserService {
  @Inject(UserRepository)
  private users: UserRepository

  async find(id: string) {
    const ⟦user|user⟧ = await this.users.findById(id)
    const inactive = await this.users.findBy(⟦col|'isActiv'⟧, false)
  }
}`,
      },
    ],
    tips: {
      user: {
        text: 'const user: {\n    id: string;\n    name: string;\n    email: string;\n    isActive: boolean | null;\n    createdAt: Date | null;\n} | null',
      },
      col: {
        error: true,
        text:
          "Argument of type '\"isActiv\"' is not assignable to parameter of type\n'\"id\" | \"name\" | \"email\" | \"isActive\" | \"createdAt\"'.\nts(2345)",
      },
    },
  },

  'websocket-data': {
    files: [
      {
        code: `interface ChatUser {
  username: string
}

@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<ChatUser> {
  protected async onOpen(ws: Socket<ChatUser>) {
    for (const ⟦peer|peer⟧ of this.⟦sockets|sockets⟧.values()) {
      peer.send(ws.data.values.⟦username|username⟧ + ' joined')
    }
  }
}`,
      },
    ],
    tips: {
      peer: { text: 'const peer: Socket<ChatUser>' },
      sockets: { text: '(property) AsenaWebSocketService<ChatUser>.sockets: Map<string, Socket<ChatUser>>' },
      username: { text: '(property) ChatUser.username: string' },
    },
  },
}
