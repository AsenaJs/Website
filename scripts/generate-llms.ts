/**
 * Generates public/llms.txt and public/llms-full.txt from the docs tree.
 *
 * Ordering and grouping come from the VitePress sidebar, page descriptions come from each
 * page's frontmatter, so neither can drift from the site. Any docs page that is not in the
 * sidebar still gets listed under "Other", which means a new page can never be silently
 * missing from llms.txt.
 *
 * Run via `bun run docs:llms` (also runs automatically as part of `bun run docs:build`).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const DOCS_DIR = join(ROOT, 'docs');
const SITE = 'https://asena.sh';

const HEADER = `# Asena

> High-performance IoC web framework built on Bun runtime with decorator-based dependency injection, achieving 200k-300k requests/sec.

- Documentation: ${SITE}
- GitHub: https://github.com/AsenaJs/Asena
- Examples: https://github.com/LibirSoft/AsenaExample
`;

const FOOTER = `## Optional

- [GitHub](https://github.com/AsenaJs/Asena)
- [npm](https://www.npmjs.com/package/@asenajs/asena)
- [Bun Runtime](https://bun.sh/docs)
`;

interface SidebarEntry {
  text: string;
  link?: string;
  items?: SidebarEntry[];
}

interface Page {
  title: string;
  description: string;
  body: string;
  rawUrl: string;
  docsPath: string;
}

/** Splits frontmatter from the markdown body. */
function parsePage(absPath: string): { data: Record<string, string>; body: string } {
  const raw = readFileSync(absPath, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);

  if (!match) {
    return { data: {}, body: raw };
  }

  const data: Record<string, string> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);

    if (kv) {
      data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  }

  return { data, body: raw.slice(match[0].length) };
}

function listDocs(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      out.push(...listDocs(full));
    } else if (entry.endsWith('.md')) {
      out.push(full);
    }
  }

  return out;
}

/** Resolves a sidebar link like "/docs/concepts/ulak" to a page, or null for external/non-docs links. */
function pageFromLink(link: string): Page | null {
  if (!link.startsWith('/docs/')) {
    return null;
  }

  const docsPath = `${link.slice('/docs/'.length)}.md`;
  const absPath = join(DOCS_DIR, docsPath);

  let parsed: ReturnType<typeof parsePage>;

  try {
    parsed = parsePage(absPath);
  } catch {
    console.warn(`  ! sidebar link has no file: ${link}`);

    return null;
  }

  return {
    title: parsed.data.title ?? docsPath,
    description: parsed.data.description ?? '',
    body: parsed.body,
    rawUrl: `${SITE}/raw/${docsPath}`,
    docsPath,
  };
}

const config = (await import('../.vitepress/config.mts')).default as {
  themeConfig: { sidebar: SidebarEntry[] };
};

const sidebar = config.themeConfig.sidebar;
const sections: { title: string; pages: Page[] }[] = [];
const seen = new Set<string>();

function collect(entries: SidebarEntry[], into: Page[]) {
  for (const entry of entries) {
    if (entry.items) {
      const pages: Page[] = [];

      collect(entry.items, pages);
      sections.push({ title: entry.text, pages });
      continue;
    }

    const page = entry.link ? pageFromLink(entry.link) : null;

    if (page && !seen.has(page.docsPath)) {
      seen.add(page.docsPath);
      into.push(page);
    }
  }
}

// Top-level sidebar links (Philosophy, Quick Start, ...) become the "Docs" section
const topLevel: Page[] = [];

collect(sidebar, topLevel);
sections.unshift({ title: 'Docs', pages: topLevel });

// Anything published but absent from the sidebar still gets listed, so llms.txt stays complete
const orphans: Page[] = [];

for (const absPath of listDocs(DOCS_DIR)) {
  const docsPath = relative(DOCS_DIR, absPath);

  if (seen.has(docsPath)) {
    continue;
  }

  const parsed = parsePage(absPath);

  // Redirect stubs and other non-content pages opt out with `llms: false`
  if (parsed.data.llms === 'false') {
    continue;
  }

  orphans.push({
    title: parsed.data.title ?? docsPath,
    description: parsed.data.description ?? '',
    body: parsed.body,
    rawUrl: `${SITE}/raw/${docsPath}`,
    docsPath,
  });
}

if (orphans.length) {
  sections.push({ title: 'Other', pages: orphans });
  console.warn(`  ! ${orphans.length} page(s) not in the sidebar, listed under "Other": ${orphans.map((p) => p.docsPath).join(', ')}`);
}

const missingDescription = sections.flatMap((s) => s.pages).filter((p) => !p.description);

if (missingDescription.length) {
  console.error(`Pages missing a frontmatter description: ${missingDescription.map((p) => p.docsPath).join(', ')}`);
  process.exit(1);
}

// ---- llms.txt : index with one line per page ----
const index = [HEADER];

for (const section of sections) {
  if (!section.pages.length) continue;

  index.push(`## ${section.title}\n`);

  for (const page of section.pages) {
    index.push(`- [${page.title}](${page.rawUrl}): ${page.description}`);
  }

  index.push('');
}

index.push(FOOTER);
writeFileSync(join(ROOT, 'public/llms.txt'), index.join('\n'));

// ---- llms-full.txt : every page inlined ----
const full = [
  HEADER,
  '> This file contains the full text of every documentation page, concatenated.',
  '> For a linked index instead, see https://asena.sh/llms.txt',
  '',
];

for (const section of sections) {
  if (!section.pages.length) continue;

  for (const page of section.pages) {
    full.push(`\n---\n`);
    full.push(`# ${page.title}`);
    full.push(`Section: ${section.title}`);
    full.push(`Source: ${page.rawUrl}\n`);
    full.push(page.body.trim());
    full.push('');
  }
}

writeFileSync(join(ROOT, 'public/llms-full.txt'), full.join('\n'));

const total = sections.reduce((n, s) => n + s.pages.length, 0);

console.log(`llms.txt      ${total} pages across ${sections.filter((s) => s.pages.length).length} sections`);
console.log(`llms-full.txt written`);
