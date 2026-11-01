/**
 * Writes every benchmark number outside docs/benchmarks.md from data/benchmarks.json, so a
 * figure on the site can never lag behind the sweep it claims to come from.
 *
 * A number is never typed by hand: wrap it in a region and the region is re-rendered.
 *   inline  <!-- bench:rps asena-ergenecore-bun s1a -->211,630<!-- /bench:rps -->
 *   block   the opening and closing markers on their own lines, blank line inside each
 *
 * Inline: rps T S · krps T S · ratio T1 S1 T2 S2 · memory · connections · cpus
 * Block:  table SCENARIOS TARGETS [bold=T] · landing-bars ASENA RIVAL SCENARIOS
 * T is a target from the benchmark report (asena-ergenecore-bun), S a scenario key (s1a, s6a-orm).
 *
 *   bun scripts/generate-bench.ts                    re-render the regions (part of docs:build)
 *   bun scripts/generate-bench.ts --check            exit 1 when a region is out of date
 *   bun scripts/generate-bench.ts --report <file>    refresh data/benchmarks.json from an
 *                                                    AsenaJs/benchmark results/report.json first
 *
 * After a sweep: regenerate docs/benchmarks.md with the benchmark repo's tools/website-page.ts,
 * then run this with --report. The build refuses a snapshot from a different sweep than the page.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { BENCH_OPENER, BENCH_REGION } from './bench-markers';

const ROOT = resolve(import.meta.dir, '..');
const SNAPSHOT = join(ROOT, 'data/benchmarks.json');
const BENCHMARK_PAGE = join(ROOT, 'docs/benchmarks.md');

interface Snapshot {
  source: { repository: string; commit: string | null; date: string | null };
  environment: { cpus: number; memoryLimit: string; connections: number; bun: string; node: string };
  targets: Record<string, { app: string; runtime: string; dbLayer: string; rps: Record<string, number> }>;
}

const SCENARIO_TITLES: Record<string, string> = {
  s1a: 'Plaintext',
  s1b: 'JSON serialization',
  s2a: 'Query string parsing',
  s2b: 'Path parameters',
  s3: 'Full API endpoint',
  s4a: 'Static file · 4 KB',
  s4b: 'Static file · 256 KB',
  s5: 'Request validation',
  s6a: 'Database · read by id',
  s6b: 'Database · paged list',
  s6c: 'Database · insert',
};

const APP_LABELS: Record<string, string> = {
  'asena-ergenecore': 'Ergenecore',
  'asena-hono': 'Hono adapter',
  'nest-express': 'NestJS · Express',
  'nest-fastify': 'NestJS · Fastify',
  elysia: 'Elysia',
  hono: 'Hono',
  fastify: 'Fastify',
  express: 'Express',
};

const ORM_LAYER = /typeorm|drizzle|prisma|sequelize|mikro-orm/i;

const n = (v: number) => Math.round(v).toLocaleString('en-US');
const ratio = (a: number, b: number) => (a / b).toFixed(2);

function title(scenario: string): string {
  const orm = scenario.endsWith('-orm');
  const base = SCENARIO_TITLES[orm ? scenario.slice(0, -4) : scenario];

  if (!base) throw new Error(`unknown scenario "${scenario}"`);

  return orm ? `${base}, ORM` : base;
}

function target(data: Snapshot, name: string) {
  const t = data.targets[name];

  if (!t) throw new Error(`unknown benchmark target "${name}"`);

  return t;
}

/** `s6a-orm` falls back to `s6a` only for a stack whose single data layer is already an ORM (NestJS on TypeORM). */
function rps(data: Snapshot, name: string, scenario: string): number {
  const t = target(data, name);
  let v = t.rps[scenario];

  if (v === undefined && scenario.endsWith('-orm') && !Object.keys(t.rps).some((k) => k.endsWith('-orm')) && ORM_LAYER.test(t.dbLayer)) {
    v = t.rps[scenario.slice(0, -4)];
  }

  if (v === undefined) throw new Error(`no ${scenario} result for ${name}`);

  return v;
}

function shortLabel(data: Snapshot, name: string): string {
  const app = target(data, name).app;

  if (app.startsWith('asena-')) return 'Asena';
  if (app.startsWith('nest-')) return 'NestJS';

  return APP_LABELS[app] ?? app;
}

function table(data: Snapshot, [columns, rows, bold]: string[]): string {
  const scenarios = columns!.split(',');
  const highlighted = bold?.replace(/^bold=/, '');
  const head = ['Adapter', 'Runtime', ...scenarios.map(title)];
  const body = rows!.split(',').map((name) => {
    const t = target(data, name);
    const strong = (cell: string) => (name === highlighted ? `**${cell}**` : cell);

    return [
      strong(APP_LABELS[t.app] ?? t.app),
      t.runtime === 'node' ? 'Node' : 'Bun',
      ...scenarios.map((s) => strong(n(rps(data, name, s)))),
    ];
  });
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((r) => r[i]!.length)));
  const line = (cells: string[]) =>
    `| ${cells.map((c, i) => (i < 2 ? c.padEnd(widths[i]!) : c.padStart(widths[i]!))).join(' | ')} |`;
  const rule = `|${widths.map((w, i) => (i < 2 ? `:${'-'.repeat(w + 1)}` : `${'-'.repeat(w + 1)}:`)).join('|')}|`;

  return [line(head), rule, ...body.map(line)].join('\n');
}

function landingBars(data: Snapshot, [asena, rival, columns]: string[]): string {
  const rows = columns!.split(',').map((s) => ({ s, a: rps(data, asena!, s), b: rps(data, rival!, s) }));
  const max = Math.max(...rows.flatMap((r) => [r.a, r.b]));
  const bar = (cls: string, v: number, name: string) =>
    `<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill ${cls}" style="width:${Number(((v / max) * 100).toFixed(1))}%"></span></div><span class="lp-bar-val"><b>${n(v)}</b> ${shortLabel(data, name)}</span></div>`;

  return rows
    .map((r) => {
      if (r.a < r.b) throw new Error(`landing bars say "faster", but ${asena} trails ${rival} on ${r.s}`);

      return [
        '<div class="lp-bar-row">',
        `<div class="lp-bar-head"><b>${title(r.s)}</b><span>${ratio(r.a, r.b)}× faster</span></div>`,
        bar('is-asena', r.a, asena!),
        bar('is-rival', r.b, rival!),
        '</div>',
      ].join('\n');
    })
    .join('\n\n');
}

type Renderer = (data: Snapshot, args: string[]) => string;

const INLINE: Record<string, Renderer> = {
  rps: (d, [t, s]) => n(rps(d, t!, s!)),
  krps: (d, [t, s]) => `${Math.round(rps(d, t!, s!) / 1000)}k`,
  ratio: (d, [t1, s1, t2, s2]) => ratio(rps(d, t1!, s1!), rps(d, t2!, s2!)),
  memory: (d) => d.environment.memoryLimit,
  connections: (d) => String(d.environment.connections),
  cpus: (d) => (d.environment.cpus === 1 ? 'one CPU' : `${d.environment.cpus} CPUs`),
};

const BLOCK: Record<string, Renderer> = { table, 'landing-bars': landingBars };

function render(data: Snapshot, file: string, text: string): string {
  let rendered = 0;
  const out = text.replace(BENCH_REGION, (_, name: string, rawArgs: string, content: string) => {
    rendered++;
    const block = /^\r?\n/.test(content);
    const eol = content.startsWith('\r\n') ? '\r\n' : '\n';
    const renderer = (block ? BLOCK : INLINE)[name];

    if (!renderer) throw new Error(`${file}: no ${block ? 'block' : 'inline'} renderer "${name}"`);

    let body: string;

    try {
      body = renderer(data, rawArgs.trim().split(/\s+/).filter(Boolean));
    } catch (error) {
      throw new Error(`${file}: bench:${name}${rawArgs}: ${(error as Error).message}`);
    }

    return `<!-- bench:${name}${rawArgs} -->${block ? `\n\n${body}\n\n`.replace(/\n/g, eol) : body}<!-- /bench:${name} -->`;
  });
  const opened = text.match(BENCH_OPENER)?.length ?? 0;

  if (opened !== rendered) throw new Error(`${file}: ${opened - rendered} bench region(s) never closed`);

  return out;
}

function pages(dir = join(ROOT, 'docs')): string[] {
  const out = dir === join(ROOT, 'docs') ? [join(ROOT, 'index.md')] : [];

  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) out.push(...pages(full));
    else if (entry.endsWith('.md')) out.push(full);
  }

  return out;
}

function snapshotFromReport(reportPath: string): Snapshot {
  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as any[];
  const env = report[0]?.meta?.environment;

  if (!env?.serverLimits) throw new Error(`${reportPath} has no meta.environment.serverLimits; it predates the sequential runner`);

  const memory = /MemoryMax=(\d+)([GM])/.exec(env.serverLimits);
  const cpus = /taskset (\d+) logical CPU/.exec(env.serverLimits);

  if (!memory || !cpus) throw new Error(`cannot read the server limits from "${env.serverLimits}"`);

  const dir = dirname(resolve(reportPath));
  const git = (...args: string[]) => {
    try {
      return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return null;
    }
  };
  const committed = git('status', '--porcelain', '--', resolve(reportPath)) === '';
  const targets: Snapshot['targets'] = {};

  for (const t of report) {
    const values: Record<string, number> = {};

    for (const [key, s] of Object.entries<any>(t.scenarios)) {
      if (s.status === 'ok' && s.median) values[key] = s.median.rps;
    }

    targets[t.target] = { app: t.app, runtime: t.runtime, dbLayer: t.dbLayer, rps: values };
  }

  return {
    source: {
      repository: 'https://github.com/AsenaJs/benchmark',
      commit: committed ? git('rev-parse', 'HEAD') : null,
      date: git('log', '-1', '--format=%cs', '--', resolve(reportPath)),
    },
    environment: {
      cpus: Number(cpus[1]),
      memoryLimit: `${memory[1]} ${memory[2]}B`,
      connections: env.profile.connections,
      bun: env.bun,
      node: env.node,
    },
    targets,
  };
}

const PAGE_APPS: Record<string, string> = {
  'Asena Ergenecore': 'asena-ergenecore',
  'Asena Hono': 'asena-hono',
  'NestJS Express': 'nest-express',
  'NestJS Fastify': 'nest-fastify',
  Elysia: 'elysia',
  Hono: 'hono',
  Fastify: 'fastify',
  Express: 'express',
};

const PAGE_COLUMNS: Record<string, string> = {
  Plaintext: 's1a',
  'JSON serialization': 's1b',
  'Query string parsing': 's2a',
  'Path parameters': 's2b',
  'Full API endpoint': 's3',
  'Request validation': 's5',
  'DB read by id': 's6a',
  'Static 4 KB': 's4a',
};

const PAGE_ORM_ROWS: Record<string, string> = { 'read by id': 's6a', 'paged list': 's6b', insert: 's6c' };

function sectionTable(page: string, heading: string): string[][] {
  const section = page.split(/^## /m).find((s) => s.startsWith(`${heading}\n`));
  const rows = (section ?? '').split('\n').filter((line) => line.startsWith('|'));

  if (rows.length < 3) throw new Error(`docs/benchmarks.md has no "${heading}" table`);

  return rows.map((line) => line.slice(1, -1).split('|').map((cell) => cell.replace(/\s+/g, ' ').trim()));
}

/**
 * docs/benchmarks.md is generated in the benchmark repo. Its full-results table, its ORM table and its
 * methodology must print exactly the snapshot's figures, target by target, or the two came from different sweeps.
 */
function assertSameSweepAsBenchmarkPage(data: Snapshot): void {
  const page = readFileSync(BENCHMARK_PAGE, 'utf8');
  const mismatches: string[] = [];
  const expect = (where: string, shown: string | undefined, name: string, scenario: string) => {
    const value = data.targets[name]?.rps[scenario];
    const wanted = value === undefined ? 'nothing' : n(value);

    if (shown !== wanted) mismatches.push(`${where}: page ${shown ?? 'nothing'}, snapshot ${wanted}`);
  };

  const [head, , ...results] = sectionTable(page, 'Full results');
  const seen = new Set<string>();

  for (const row of results) {
    const app = PAGE_APPS[row[0]!];
    const name = `${app}-${row[1]!.toLowerCase()}`;

    if (!app) throw new Error(`docs/benchmarks.md full results: unknown framework "${row[0]}"`);

    seen.add(name);
    head!.slice(2).forEach((column, i) => {
      const scenario = PAGE_COLUMNS[column];

      if (!scenario) throw new Error(`docs/benchmarks.md full results: unknown column "${column}"`);

      expect(`${name} ${scenario}`, row[i + 2], name, scenario);
    });
  }

  for (const name of Object.keys(data.targets)) {
    if (!seen.has(name)) mismatches.push(`${name}: in the snapshot, not on the page`);
  }

  const [, , ...orm] = sectionTable(page, 'What an ORM costs');

  for (const [operation, raw, drizzle] of orm) {
    const scenario = PAGE_ORM_ROWS[operation!];

    if (!scenario) throw new Error(`docs/benchmarks.md ORM table: unknown operation "${operation}"`);

    expect(`asena-ergenecore-bun ${scenario}`, raw, 'asena-ergenecore-bun', scenario);
    expect(`asena-ergenecore-bun ${scenario}-orm`, drizzle, 'asena-ergenecore-bun', `${scenario}-orm`);
  }

  const { memoryLimit, connections } = data.environment;

  if (!page.includes(`${memoryLimit} RAM** per server`)) mismatches.push(`methodology: no ${memoryLimit} server budget`);
  if (!page.includes(`${connections} connections`)) mismatches.push(`methodology: no ${connections} connections`);

  if (mismatches.length) {
    throw new Error(
      `data/benchmarks.json and docs/benchmarks.md come from different sweeps:\n    ${mismatches.slice(0, 8).join('\n    ')}` +
        `${mismatches.length > 8 ? `\n    … ${mismatches.length - 8} more` : ''}\n` +
        '  Both must come from the same results/report.json of an AsenaJs/benchmark checkout:\n' +
        '    bun tools/website-page.ts <this Website checkout>          (in the benchmark checkout)\n' +
        '    bun scripts/generate-bench.ts --report <benchmark checkout>/results/report.json',
    );
  }
}

function main(argv: string[]): void {
  const check = argv.includes('--check');
  const reportAt = argv.indexOf('--report');
  let data: Snapshot;

  if (reportAt !== -1) {
    const reportPath = argv[reportAt + 1];

    if (!reportPath) throw new Error('--report needs the path of results/report.json');
    if (check) throw new Error('--check reads the committed snapshot; drop --report');

    data = snapshotFromReport(reportPath);
    assertSameSweepAsBenchmarkPage(data);
    writeFileSync(SNAPSHOT, `${JSON.stringify(data, null, 2)}\n`);
  } else {
    data = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
    assertSameSweepAsBenchmarkPage(data);
  }

  const stale: string[] = [];

  for (const file of pages()) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, 'utf8');
    const out = render(data, rel, text);

    if (out === text) continue;

    stale.push(rel);

    if (!check) writeFileSync(file, out);
  }

  if (check && stale.length) {
    console.error(`bench: out of date, run bun run docs:bench:\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }

  console.log(stale.length ? `bench: updated ${stale.join(', ')}` : 'bench: every region is current');
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(`bench: ${(error as Error).message}`);
  process.exit(1);
}
