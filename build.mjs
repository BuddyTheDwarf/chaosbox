// build.mjs — scans contributions/, copies each into public/c/, writes the landing + live wall.
// ponytail: zero deps, zero DB. The git history IS the ledger (who/when/PR), the repo IS the store.
// We only COPY files and read text — never execute a contribution. Untrusted code runs only
// client-side, inside a sandboxed iframe.
import { readdir, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const SRC = 'contributions';
const OUT = 'public';
const REPO = 'https://github.com/BuddyTheDwarf/chaosbox';
const CONTRIB = `${REPO}/blob/main/CONTRIBUTING.md`;
const HISTORY = `${REPO}/pulls?q=is%3Apr+is%3Amerged`;

// git metadata for a contribution = who added it + when + which PR. Needs full history at build
// (CI checkout uses fetch-depth: 0). Falls back to '' for a not-yet-committed local contribution.
const addedInfo = (dir) => {
  try {
    const out = execFileSync('git',
      ['log', '--reverse', '--format=%an%x09%aI%x09%s', '--', `${SRC}/${dir}`],
      { encoding: 'utf8' }).trim();
    if (!out) return { author: '', iso: '', pr: '' };
    const [author, iso, subject] = out.split('\n')[0].split('\t');
    return { author: author || '', iso: iso || '', pr: (subject?.match(/\(#(\d+)\)/) || [])[1] || '' };
  } catch { return { author: '', iso: '', pr: '' }; }
};
const fmtDate = iso => iso
  ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  : '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'c'), { recursive: true });

const dirs = (await readdir(SRC, { withFileTypes: true }))
  .filter(d => d.isDirectory() && !d.name.startsWith('.'));

const cards = [];
for (const d of dirs) {
  await cp(join(SRC, d.name), join(OUT, 'c', d.name), { recursive: true });
  let title = d.name, desc = '';
  try {
    const html = await readFile(join(SRC, d.name, 'index.html'), 'utf8');
    const mt = html.match(/<title>([^<]*)<\/title>/i);
    if (mt && mt[1].trim()) title = mt[1].trim();
    const md = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    if (md && md[1].trim()) desc = md[1].trim();
  } catch { /* no index.html -> dir name as title */ }
  cards.push({ name: d.name, title, desc, ...addedInfo(d.name) });
}
cards.sort((a, b) => (b.iso || '').localeCompare(a.iso || ''));   // newest first

const count = cards.length;
const countLabel = count === 0 ? 'The wall is empty' : `${count} page${count > 1 ? 's' : ''} the crowd shipped`;

const wall = count ? `
    <div class="filterbar">
      <input id="q" type="search" placeholder="grep the wall — name, author, what it does…" autocomplete="off" aria-label="Filter contributions">
      <a class="hist" href="${HISTORY}" target="_blank" rel="noopener">full PR history ↗</a>
    </div>
    <div class="wall">${cards.map(c => {
      const hay = esc((`${c.title} ${c.name} ${c.desc} ${c.author}`).toLowerCase());
      const when = fmtDate(c.iso);
      const who = c.author ? `by ${esc(c.author)}` : 'seed';
      return `
      <figure class="live" data-search="${hay}">
        <a class="open" href="c/${encodeURIComponent(c.name)}/index.html" target="_blank" rel="noopener" title="Open “${esc(c.title)}” full page">
          <iframe src="c/${encodeURIComponent(c.name)}/index.html" sandbox="allow-scripts" loading="lazy" title="${esc(c.title)}" tabindex="-1"></iframe>
          <span class="openhint">open full page ↗</span>
        </a>
        <figcaption>
          <div class="row"><b>${esc(c.title)}</b><span class="path">/${esc(c.name)}</span></div>
          ${c.desc ? `<p class="desc">${esc(c.desc)}</p>` : ''}
          <div class="row sub">
            <span class="who">${who}${when ? ` · ${when}` : ''}</span>
            ${c.pr ? `<a class="pr" href="${REPO}/pull/${c.pr}" target="_blank" rel="noopener">#${c.pr} ↗</a>` : ''}
          </div>
        </figcaption>
      </figure>`;
    }).join('')}
    </div>` : `<div class="empty">Nothing on the wall yet — be the first. <a href="${CONTRIB}">Open a PR →</a></div>`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>chaosbox — a website anyone can edit, if the crowd says yes</title>
<meta name="description" content="Open a pull request adding a page to /contributions, rally 👍 on the PR, and once it clears the vote bar a bot merges it — live, with no maintainer in the loop. Open source, sandboxed, vote-merged.">
<meta property="og:title" content="chaosbox — a website the crowd builds">
<meta property="og:description" content="Open a PR. Get votes. A bot ships it live. No gatekeeper.">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* ── chaosbox: terminal-playground theme — grid canvas, lime accent, Space Grotesk ── */
  :root{
    --bg:#0b0c0a; --surface:#141613; --elevated:#1b1e18; --border:#272b22;
    --fg:#e9ece2; --muted:#969c89; --accent:#bef264; --accent-deep:#9bd13f; --ink:#0b0c0a;
    --good:#9bd13f; --star:#f3c14b; --grid:rgba(190,242,100,.05);
    --display:"Space Grotesk",system-ui,sans-serif;
    --font:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --mono:ui-monospace,"SF Mono","JetBrains Mono","Fira Code",Menlo,monospace;
    --radius:14px;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;color:var(--fg);font-family:var(--font);-webkit-font-smoothing:antialiased;
    line-height:1.6;min-height:100vh;overflow-x:hidden;
    background:
      linear-gradient(var(--grid) 1px,transparent 1px) 0 0/32px 32px,
      linear-gradient(90deg,var(--grid) 1px,transparent 1px) 0 0/32px 32px,
      var(--bg)}
  body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(900px 460px at 50% -12%,rgba(190,242,100,.10),transparent 62%)}
  .wrap{max-width:1000px;margin:0 auto;padding:0 24px;position:relative;z-index:1}
  a{color:inherit;text-decoration:none}
  ::selection{background:var(--accent);color:var(--ink)}

  /* header */
  header{display:flex;align-items:center;justify-content:space-between;padding:24px 0}
  .logo{font-family:var(--mono);font-weight:700;font-size:17px;letter-spacing:-.01em;display:inline-flex;align-items:center}
  .logo b{color:var(--accent);font-weight:700}
  .logo .cur{color:var(--accent);margin-left:1px;animation:blink 1.1s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
  nav{display:flex;align-items:center;gap:22px}
  nav a{color:var(--muted);font-size:14.5px;font-weight:500;transition:color .15s}
  nav a:hover{color:var(--fg)}
  nav a.gh{color:var(--ink);font-weight:700;border-radius:10px;padding:7px 14px;
    background:var(--accent);transition:transform .15s,box-shadow .15s;box-shadow:0 3px 0 var(--accent-deep)}
  nav a.gh:hover{transform:translateY(-1px);box-shadow:0 5px 0 var(--accent-deep)}
  @media(max-width:680px){nav .hide{display:none}}

  /* hero */
  .hero{text-align:center;padding:58px 0 26px}
  .kicker{display:inline-block;font-family:var(--mono);font-size:13px;color:var(--muted);letter-spacing:.02em;margin-bottom:22px}
  .kicker b{color:var(--accent);font-weight:600}
  h1{font-family:var(--display);font-size:clamp(36px,6.2vw,60px);line-height:1.05;letter-spacing:-.02em;font-weight:700;margin:.1em 0 .35em}
  h1 .mark{display:inline-block;background:var(--accent);color:var(--ink);padding:0 .14em;border-radius:5px;
    transform:rotate(-2deg);box-decoration-break:clone;-webkit-box-decoration-break:clone}
  .sub{font-size:clamp(16px,2.2vw,19px);color:var(--muted);max-width:640px;margin:0 auto 28px}
  .cta{display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center}
  .btn{position:relative;appearance:none;border:0;border-radius:12px;padding:14px 22px;font-family:inherit;
    font-weight:600;font-size:15px;cursor:pointer;transition:transform .12s,box-shadow .12s,border-color .15s,color .15s;
    display:inline-flex;align-items:center;gap:8px}
  .btn.primary{background:var(--accent);color:var(--ink);font-weight:700;box-shadow:0 4px 0 var(--accent-deep)}
  .btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 0 var(--accent-deep)}
  .btn.primary:active{transform:translateY(3px);box-shadow:0 1px 0 var(--accent-deep)}
  .btn.ghost{background:transparent;color:var(--fg);border:1px solid var(--border)}
  .btn.ghost:hover{border-color:var(--accent);color:var(--accent)}
  .note{margin-top:16px;font-size:13px;color:var(--muted);max-width:560px;margin-left:auto;margin-right:auto}

  /* PR demo */
  .demo{margin:42px auto 0;max-width:560px;text-align:left;background:var(--surface);
    border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:0 24px 70px -40px #000}
  .demo .bar{background:#0c0e0a;padding:11px 16px;border-bottom:1px solid var(--border);
    font-family:var(--mono);font-size:12.5px;color:var(--muted);display:flex;gap:8px;align-items:center}
  .demo .dot{width:10px;height:10px;border-radius:50%}
  .demo .ttl{margin-left:6px;color:#bdc4ad}
  .bubble{margin:16px;background:var(--elevated);border:1px solid var(--border);
    border-radius:12px;border-top-left-radius:4px;padding:14px 16px;
    font:13px/1.6 var(--mono);white-space:pre-wrap;word-break:break-word;color:#cdd3c0}
  .bubble .hd{font-weight:700;color:var(--fg);font-family:var(--display);font-size:14px;display:block;margin-bottom:8px}
  .bubble .score{display:block;margin-top:8px;font-weight:700;font-family:var(--display);color:var(--accent)}

  /* sections */
  section{padding:64px 0;border-top:1px solid var(--border)}
  .eyebrow{font-family:var(--mono);font-size:12.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin:0 0 10px}
  h2{font-family:var(--display);font-size:clamp(24px,3.4vw,32px);line-height:1.15;letter-spacing:-.01em;font-weight:700;margin:0 0 8px}
  .lede{color:var(--muted);max-width:640px;margin:0 0 30px;font-size:16px}

  /* steps */
  .steps{display:grid;gap:18px}
  .step{display:flex;gap:18px;align-items:flex-start;background:var(--surface);
    border:1px solid var(--border);border-radius:14px;padding:18px 20px;transition:border-color .15s,transform .15s}
  .step:hover{border-color:#3a4030;transform:translateY(-2px)}
  .step .n{flex:0 0 auto;width:34px;height:34px;border-radius:8px;display:grid;place-items:center;
    font-family:var(--mono);font-weight:700;font-size:15px;color:var(--ink);background:var(--accent)}
  .step b{display:block;font-size:15.5px;margin-bottom:2px}
  .step span{color:var(--muted);font-size:14.5px}
  .step code,.lede code{font-family:var(--mono);font-size:13px;background:#0c0e0a;border:1px solid var(--border);
    border-radius:6px;padding:1px 6px;color:#cdd9c5}

  /* feature grid */
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;transition:border-color .15s,transform .15s}
  .card:hover{border-color:#3a4030;transform:translateY(-3px)}
  .card .ico{font-size:22px;margin-bottom:12px}
  .card h3{margin:0 0 6px;font-size:16px;font-weight:700;font-family:var(--display)}
  .card p{margin:0;color:var(--muted);font-size:14.5px}
  .card code{font-family:var(--mono);font-size:12.5px;color:#cdd9c5}

  /* filter bar + the live wall */
  .filterbar{display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap}
  .filterbar input{flex:1;min-width:200px;background:var(--surface);border:1px solid var(--border);
    border-radius:10px;padding:11px 14px;color:var(--fg);font-family:var(--mono);font-size:13.5px}
  .filterbar input:focus{outline:0;border-color:var(--accent)}
  .filterbar input::placeholder{color:#5c6350}
  .filterbar .hist{font-family:var(--mono);color:var(--accent);font-size:13.5px;font-weight:600;white-space:nowrap}
  .filterbar .hist:hover{color:var(--fg)}
  .wall{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
  .wall figure{margin:0;background:var(--surface);border:1px solid var(--border);
    border-radius:14px;overflow:hidden;transition:border-color .15s,transform .15s}
  .wall figure:hover{border-color:#3a4030;transform:translateY(-3px)}
  .wall .open{position:relative;display:block;cursor:pointer}
  .wall iframe{width:100%;height:230px;border:0;background:#fff;display:block;pointer-events:none}
  .wall .openhint{position:absolute;inset:0;display:grid;place-items:center;background:rgba(11,12,10,.6);
    color:var(--accent);font-family:var(--mono);font-weight:600;font-size:14px;opacity:0;transition:opacity .15s}
  .wall .open:hover .openhint{opacity:1}
  .wall figcaption{padding:.8rem .9rem;border-top:1px solid var(--border)}
  .wall .row{display:flex;justify-content:space-between;gap:.6rem;align-items:baseline}
  .wall figcaption b{font-weight:600;font-size:14.5px}
  .wall .path{color:#5c6350;font-family:var(--mono);font-size:12px;white-space:nowrap}
  .wall .desc{margin:.45rem 0 .4rem;color:var(--muted);font-size:13.5px;line-height:1.45}
  .wall .sub{margin-top:.3rem;font-size:12.5px}
  .wall .who{color:var(--muted);font-family:var(--mono)}
  .wall .pr{color:var(--accent);font-weight:600;font-family:var(--mono);white-space:nowrap}
  .wall .pr:hover{color:var(--fg)}
  .empty{background:var(--surface);border:1px dashed var(--border);border-radius:14px;
    padding:48px 24px;text-align:center;color:var(--muted)}
  .empty a{color:var(--accent);font-weight:600}

  /* code */
  pre{background:#0b0e08;border:1px solid var(--border);border-radius:14px;padding:18px 20px;
    overflow:auto;font:13.5px/1.7 var(--mono);color:#cdd9c5;margin:0}
  pre .c{color:#6b7359}

  /* rules box */
  .legal{display:flex;gap:14px;align-items:flex-start;background:rgba(243,193,75,.05);
    border:1px solid rgba(243,193,75,.25);border-radius:14px;padding:18px 20px;color:#e7d4ad;font-size:14px}
  .legal .ico{font-size:18px;flex:0 0 auto}
  .legal b{color:#f3dba6}
  .legal code{font-family:var(--mono);font-size:13px;color:#f1e2bf}

  /* footer */
  footer{border-top:1px solid var(--border);padding:40px 0;text-align:center;color:var(--muted);font-size:13.5px;font-family:var(--mono)}
  footer .meta span{color:#5c6350;margin:0 6px}
  footer a{color:var(--fg);font-weight:600;border-bottom:1px solid transparent;transition:color .15s,border-color .15s}
  footer a:hover{color:var(--accent);border-color:var(--accent)}

  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
      transition-duration:.001ms!important;scroll-behavior:auto!important}
  }
</style>
</head>
<body>
<div class="wrap">

  <header>
    <div class="logo">chaos<b>box</b><span class="cur">▌</span></div>
    <nav>
      <a class="hide" href="#how">How it works</a>
      <a class="hide" href="#wall">The wall</a>
      <a class="hide" href="${HISTORY}" target="_blank" rel="noopener">History ↗</a>
      <a class="gh" href="${REPO}" target="_blank" rel="noopener">GitHub ↗</a>
    </nav>
  </header>

  <div class="hero">
    <span class="kicker"><b>//</b> open source · vote-merged · no gatekeeper</span>
    <h1>Open a pull request.<br>Let the <span class="mark">crowd</span> ship it.</h1>
    <p class="sub">Add a page to <code>/contributions</code>, rally 👍 on the PR, and once it clears the
      vote bar a bot merges it — live on this site, with no maintainer in the loop.</p>
    <div class="cta">
      <a href="${CONTRIB}" class="btn primary" target="_blank" rel="noopener">Add your page →</a>
      <a href="#how" class="btn ghost">See how it works</a>
    </div>
    <div class="note">Every contribution runs sandboxed in its own iframe — it can't touch the rest of
      the site, your cookies, or anyone else's page.</div>

    <div class="demo" role="img" aria-label="Example: a pull request getting voted in and auto-merged">
      <div class="bar">
        <span class="dot" style="background:#ff5f57"></span>
        <span class="dot" style="background:#febc2e"></span>
        <span class="dot" style="background:#28c840"></span>
        <span class="ttl">github · pull request</span>
      </div>
      <div class="bubble"><span class="hd">🟢 #42 · add neon-clock</span>contributions/neon-clock/index.html   +61 −0
checks:  ✓ guard   ✓ preview
reactions:  👍 5    👎 0</div>
      <div class="bubble"><span class="hd">🤖 chaosbox</span>🔎 Live preview: raw.githack.com/you/chaosbox/…<span class="score">🎉 Merged — net votes 5 ≥ 3, checks green. Live in ~30s.</span></div>
    </div>
  </div>

  <section id="how">
    <p class="eyebrow">How it works</p>
    <h2>Four steps, no gatekeeper.</h2>
    <p class="lede">It's a real GitHub repo. You don't ask permission — you open a PR and let the votes decide.</p>
    <div class="steps">
      <div class="step"><div class="n">1</div><div><b>Propose</b><span>Fork the repo and add <code>contributions/&lt;name&gt;/index.html</code> — one self-contained page. A toy, a note, a tiny game.</span></div></div>
      <div class="step"><div class="n">2</div><div><b>Preview</b><span>A bot instantly comments a live link so anyone can see your page running, straight from your fork, before they vote.</span></div></div>
      <div class="step"><div class="n">3</div><div><b>Vote</b><span>People react 👍 / 👎 on the PR. Distinct upvotes minus downvotes is your score — the crowd is the reviewer.</span></div></div>
      <div class="step"><div class="n">4</div><div><b>Ship</b><span>Clear the vote bar + green checks + one hour, and a bot merges it automatically. It lands on the wall below, live.</span></div></div>
    </div>
  </section>

  <section id="wall">
    <p class="eyebrow">Live now</p>
    <h2>${countLabel}.</h2>
    <p class="lede">Everything below was added by someone on the internet and voted in by the crowd. Click any tile to open it full-page; click <code>#NN</code> for the pull request it came from.</p>
    ${wall}
  </section>

  <section id="safe">
    <p class="eyebrow">Why this isn't chaos-chaos</p>
    <h2>Open to everyone, safe by design.</h2>
    <div class="grid">
      <div class="card"><div class="ico">📦</div><h3>Sandboxed</h3><p>Contributions can only live under <code>/contributions</code>. CI rejects any PR that reaches outside it.</p></div>
      <div class="card"><div class="ico">🖼️</div><h3>Iframe-isolated</h3><p>Each page renders in <code>sandbox="allow-scripts"</code> — no access to cookies, the parent page, or other contributions.</p></div>
      <div class="card"><div class="ico">🗳️</div><h3>Vote-gated</h3><p>Nothing merges without enough net 👍, passing checks, and an hour on the clock. No drive-by merges.</p></div>
      <div class="card"><div class="ico">🔌</div><h3>Kill switch</h3><p>One flag freezes all merging instantly. Anything bad gets reverted and the site rolls back.</p></div>
      <div class="card"><div class="ico">🔒</div><h3>No secrets</h3><p>Build, preview, and the merge bot all run on the built-in token. Nothing for a malicious PR to steal.</p></div>
      <div class="card"><div class="ico">🧩</div><h3>Open source</h3><p>The whole machine — bot, CI, rules — is in the repo. Read it, fork it, run your own.</p></div>
    </div>
  </section>

  <section id="contribute">
    <p class="eyebrow">Contribute</p>
    <h2>Ship something in five minutes.</h2>
    <p class="lede">No build step, no framework, no dependencies. One HTML file is a valid contribution.</p>
    <div class="steps">
      <div class="step"><div class="n">1</div><div><b>Fork &amp; add a page</b><span>One self-contained <code>index.html</code> — inline CSS/JS welcome. Add a <code>&lt;title&gt;</code> and a <code>&lt;meta name="description"&gt;</code> and they become its card.</span>
        <pre style="margin-top:12px"><span class="c"># after forking</span>
mkdir -p contributions/my-page
$EDITOR contributions/my-page/index.html</pre></div></div>
      <div class="step"><div class="n">2</div><div><b>Open a PR</b><span>CI checks you only touched <code>/contributions</code> and that the site still builds. The preview bot posts a live link within seconds.</span></div></div>
      <div class="step"><div class="n">3</div><div><b>Rally votes</b><span>Share the PR. Net 👍 over the bar + green checks + an hour, and the bot ships it for you — no maintainer required.</span></div></div>
    </div>
    <div style="margin-top:22px;text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="${CONTRIB}" class="btn primary" target="_blank" rel="noopener">Read the contributor guide →</a>
      <a href="${REPO}" class="btn ghost" target="_blank" rel="noopener">Browse the code ↗</a>
    </div>
  </section>

  <section>
    <p class="eyebrow">The rules</p>
    <h2>Keep it decent.</h2>
    <div class="legal">
      <div class="ico">⚠️</div>
      <div><b>One self-contained page per PR, under <code>/contributions</code> only.</b> No reaching into the
        site's plumbing, no dependencies you control off-site, nothing illegal, hateful, or malicious. The
        maintainer can revert anything and ban repeat offenders, and a page passing the vote isn't an
        endorsement of it. You're posting to a public site that strangers run code on — be the kind of
        contribution you'd want to land next to.</div>
    </div>
  </section>

  <footer>
    <div class="meta">chaosbox <span>·</span> open source <span>·</span> no maintainer, just votes</div>
    <div>built by <a href="${CONTRIB}" target="_blank" rel="noopener">whoever shows up</a> — <a href="${REPO}" target="_blank" rel="noopener">source ↗</a></div>
  </footer>

</div>
<script>
  // live filter for the wall — by name, author, or description
  (function(){
    var q=document.getElementById('q'); if(!q) return;
    var cards=[].slice.call(document.querySelectorAll('.wall figure'));
    q.addEventListener('input',function(){
      var t=q.value.trim().toLowerCase();
      cards.forEach(function(c){
        c.style.display=(!t||(c.dataset.search||'').indexOf(t)>-1)?'':'none';
      });
    });
  })();
</script>
</body>
</html>`;

await writeFile(join(OUT, 'index.html'), page);
console.log(`built ${count} contribution(s) -> ${OUT}/`);
