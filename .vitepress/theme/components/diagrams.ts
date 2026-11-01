// Plain data, no Vue: scripts/generate-llms.ts imports this file to flatten <DocDiagram> to text.
// Inline `code` in any string is rendered as <code> on the page and kept as-is in llms output.

export interface DiagramCell {
  title: string;
  detail?: string;
}

export interface DiagramStep {
  cells: DiagramCell[];
  tag?: string;
}

export interface DiagramSection {
  label: string;
  steps: DiagramStep[];
}

export interface DiagramExit {
  when: string;
  then: string;
}

export interface Diagram {
  title: string;
  kind: 'flow' | 'layers';
  sections: DiagramSection[];
  exits?: DiagramExit[];
}

export const DIAGRAMS: Record<string, Diagram> = {
  bootstrap: {
    title: 'Bootstrap phases',
    kind: 'flow',
    sections: [
      {
        label: '`await AsenaServerFactory.create()`',
        steps: [
          { tag: 'CONTAINER_INIT', cells: [{ title: 'Container', detail: 'The container registers itself.' }] },
          { tag: 'LOGGER_INIT', cells: [{ title: 'Logger', detail: 'The logger you passed in is registered.' }] },
          { tag: 'IOC_ENGINE_INIT', cells: [{ title: 'IoC engine', detail: 'The engine that scans and wires components.' }] },
          { tag: 'HTTP_ADAPTER_INIT', cells: [{ title: 'Adapter', detail: 'The adapter instance is registered. Headless mode has none.' }] },
          {
            tag: 'PREPARE_SERVICES_INIT',
            cells: [{ title: 'Framework services', detail: 'Ulak, the event system, the cron runner, the lifecycle service and the services that prepare middleware, configs, validators and WebSockets.' }],
          },
          {
            tag: 'USER_COMPONENTS_SCAN',
            cells: [{ title: 'Your components', detail: 'Found by scan, `components` list or build output, plus `imports`. Registered in dependency order: singletons are constructed, `@Inject` fields wired, post-processors applied.' }],
          },
          { tag: 'USER_COMPONENTS_INIT', cells: [{ title: 'AsenaServer', detail: 'The server is resolved and receives port, health and shutdown options.' }] },
        ],
      },
      {
        label: '`await server.start()`',
        steps: [
          { cells: [{ title: '`@OnStart` hooks', detail: 'Registration order, dependencies first. A throw aborts the boot.' }] },
          {
            tag: 'APPLICATION_SETUP',
            cells: [{ title: 'Application setup', detail: '`@Config` applied, microservice transports connected, events and schedules registered, routes and WebSocket namespaces handed to the adapter.' }],
          },
          { tag: 'SERVER_READY', cells: [{ title: 'Serving', detail: 'The adapter binds the socket, cron jobs start, the health endpoint and signal handlers are installed.' }] },
        ],
      },
    ],
  },

  'request-pipeline': {
    title: 'Request pipeline',
    kind: 'flow',
    sections: [
      {
        label: 'A matched route',
        steps: [
          { tag: '1', cells: [{ title: 'Global middleware', detail: '`globalMiddlewares()` on `@Config`, filtered by include/exclude patterns.' }] },
          { tag: '2', cells: [{ title: 'Controller middleware', detail: '`@Controller({ middlewares })`, scoped to the controller path.' }] },
          { tag: '3', cells: [{ title: 'Auth guard', detail: 'Only on `@Protected` / `@Roles` routes, when `@asenajs/asena-auth` is imported. No session is a 401 with `WWW-Authenticate: Bearer`; a missing role is a 403.' }] },
          { tag: '4', cells: [{ title: 'Route middleware', detail: '`@Get({ middlewares })` and the other method decorators.' }] },
          { tag: '5', cells: [{ title: 'Validation', detail: 'The route context contract, or the `validator` class. A failure throws a `ValidationError`.' }] },
          { tag: '6', cells: [{ title: 'Handler', detail: 'The controller method, which answers with `context.send()`.' }] },
        ],
      },
    ],
    exits: [
      { when: 'Any step throws', then: '`onError(error, context)` on `@Config`, or the adapter default when there is none.' },
      { when: 'A middleware returns `false`', then: '`403 Forbidden`; nothing after it runs.' },
      { when: 'No route matches', then: 'Global middleware runs, then `onNotFound()`. Never `onError`.' },
    ],
  },

  adapters: {
    title: 'Adapter architecture',
    kind: 'layers',
    sections: [
      {
        label: 'Your application',
        steps: [
          {
            cells: [
              { title: 'Controllers · Services · Middleware · `@Config`', detail: 'Decorators come from `@asenajs/asena`. `Context`, `MiddlewareService`, `ValidationService` and `ConfigService` come from the adapter.' },
            ],
          },
        ],
      },
      {
        label: '`@asenajs/asena`',
        steps: [
          {
            cells: [
              { title: 'IoC container', detail: 'Scan, injection, scopes, lifecycle hooks.' },
              { title: 'AsenaServer', detail: 'Reads route, middleware and config metadata and hands it to the adapter.' },
              { title: '`AsenaAdapter` contract', detail: '`registerRoute`, `use`, `registerWebsocketRoute`, `onError`, `start`, `stop`.' },
            ],
          },
        ],
      },
      {
        label: 'Adapter',
        steps: [
          {
            cells: [
              { title: '`@asenajs/ergenecore`', detail: 'Native Bun routing, zero runtime dependencies.' },
              { title: '`@asenajs/hono-adapter`', detail: 'Routes through a Hono app; Hono middleware works.' },
            ],
          },
        ],
      },
      {
        label: 'Runtime',
        steps: [{ cells: [{ title: '`Bun.serve()`', detail: 'HTTP and WebSocket server. Both adapters run on Bun only.' }] }],
      },
    ],
  },
};
