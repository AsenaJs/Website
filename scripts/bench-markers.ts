export const BENCH_REGION = /<!-- bench:([a-z-]+)((?: [^\s>]+)*) -->([\s\S]*?)<!-- \/bench:\1 -->/g;

export const BENCH_OPENER = /<!-- bench:/g;

/** The rendered numbers stay, the region markers go: raw pages and llms-full.txt are read, not regenerated. */
export function stripBenchMarkers(markdown: string): string {
  return markdown.replace(/<!-- \/?bench:[^>]*-->/g, '');
}
