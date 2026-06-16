// build.mjs — scans contributions/, copies each into public/c/, writes a gallery index.html.
// ponytail: zero deps, static output. We only COPY files and read <title> as text — never execute
// a contribution. Untrusted code runs only client-side, inside a sandboxed iframe.
import { readdir, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'contributions';
const OUT = 'public';

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'c'), { recursive: true });

const dirs = (await readdir(SRC, { withFileTypes: true }))
  .filter(d => d.isDirectory() && !d.name.startsWith('.'));

const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const cards = [];
for (const d of dirs) {
  await cp(join(SRC, d.name), join(OUT, 'c', d.name), { recursive: true });
  let title = d.name;
  try {
    const m = (await readFile(join(SRC, d.name, 'index.html'), 'utf8')).match(/<title>([^<]*)<\/title>/i);
    if (m && m[1].trim()) title = m[1].trim();
  } catch { /* no index.html -> dir name as title */ }
  cards.push({ name: d.name, title });
}

const grid = cards.map(c => `
    <figure class="card">
      <iframe src="/c/${encodeURIComponent(c.name)}/index.html" sandbox="allow-scripts"
              loading="lazy" title="${esc(c.title)}"></iframe>
      <figcaption>${esc(c.title)}<span>/${esc(c.name)}</span></figcaption>
    </figure>`).join('');

const page = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>chaosbox</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;font:16px/1.5 system-ui,sans-serif;background:#0b0b0e;color:#e7e7ea}
  header{padding:2rem 1.5rem;border-bottom:1px solid #222}
  header h1{margin:0;font-size:1.4rem;letter-spacing:.5px}
  header p{margin:.5rem 0 0;color:#9a9aa2;max-width:60ch}
  a{color:#7aa2ff}
  .grid{display:grid;gap:1rem;padding:1.5rem;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
  .card{margin:0;background:#15151b;border:1px solid #26262f;border-radius:12px;overflow:hidden}
  .card iframe{width:100%;height:220px;border:0;background:#fff;display:block}
  figcaption{padding:.6rem .8rem;font-size:.9rem;display:flex;justify-content:space-between;gap:.5rem}
  figcaption span{color:#6f6f7a}
  .empty{padding:3rem 1.5rem;color:#9a9aa2}
</style></head>
<body>
  <header>
    <h1>chaosbox</h1>
    <p>Anyone opens a PR adding a page under <code>/contributions</code>. The crowd votes 👍 / 👎 on
    the PR. Enough net 👍 + green CI + a little patience → a bot merges it and it shows up here.
    <a href="https://github.com/BuddyTheDwarf/chaosbox/blob/main/CONTRIBUTING.md">Add yours →</a></p>
  </header>
  ${cards.length ? `<section class="grid">${grid}\n  </section>` : `<p class="empty">Nothing here yet. Be the first — open a PR.</p>`}
</body></html>`;

await writeFile(join(OUT, 'index.html'), page);
console.log(`built ${cards.length} contribution(s) -> ${OUT}/`);
