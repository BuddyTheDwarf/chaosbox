# chaosbox

**🌐 Live: https://buddythedwarf.github.io/chaosbox/**

A *modern Chaos*: a live site where anyone opens a PR adding a page under `/contributions`. The crowd
votes 👍/👎 on the PR — enough net 👍 + green CI + an hour of age → a bot auto-merges and the site
redeploys. Spiritual successor to [Chaosthebot/Chaos](https://github.com/Chaosthebot/Chaos), made safe
by a sandboxed contribution directory + an iframe sandbox + fork-safe CI.

## How it works

- **Contributions** are static `index.html` files under `contributions/<name>/`. `build.mjs` (zero deps)
  copies them into `public/c/<name>/` and generates the gallery `public/index.html` — each shown in an
  `<iframe sandbox="allow-scripts">`. Untrusted code never builds or runs on the server.
- **CI** (`.github/workflows/ci.yml`, `on: pull_request`) rejects any PR touching files outside
  `/contributions/`, enforces one contribution per PR, and runs the build. Fork-safe, no secrets.
- **Preview** (`.github/workflows/preview.yml`) comments a live `raw.githack.com` link on each PR so
  voters see the contribution rendered straight from the fork — no deploy, no host, no secret.
- **The bot** (`.github/workflows/automerge.yml`) runs every 10 min, tallies distinct 👍/👎 users on
  each open PR, and merges when net votes ≥ `VOTE_THRESHOLD`, the `guard` CI check is green, the PR is
  older than `MIN_PR_AGE_HOURS`, all files are in the sandbox, and the author isn't banned. Built-in
  `GITHUB_TOKEN`, no PAT.
- **Deploy** is GitHub Pages (`.github/workflows/pages.yml`): builds and publishes on every push to
  `main`. Production: `https://buddythedwarf.github.io/chaosbox/`.

## The guardrails

1. **Sandbox dir** — CI + bot both reject anything outside `/contributions/`.
2. **Fork-safe CI** — `ci.yml` is `on: pull_request` (no secrets). The preview job uses
   `pull_request_target` but never checks out or runs PR code — it only reads metadata and comments.
3. **No stored secrets** — deploy, preview, and the merge bot all use the built-in `GITHUB_TOKEN`.
   No PAT, no deploy keys.
4. **Branch protection on `main`** + the bot's per-PR age/vote gate + the iframe sandbox on every
   contribution (contributed JS can't reach our page, cookies, or origin).

## Controls

| What | Where |
|------|-------|
| **Kill switch** | Repo variable `BOT_ENABLED`. Bot does nothing unless it's exactly `true`. Set to `false` to freeze merges instantly. |
| **Vote threshold** | Repo variable `VOTE_THRESHOLD` (default 3). |
| **Min PR age** | Repo variable `MIN_PR_AGE_HOURS` (default 1). |
| **Ban list** | `bot/banlist.txt`, one username per line. |
| **Panic** | Set `BOT_ENABLED=false`, then `git revert` bad merges on `main` (Pages redeploys the good state). |

> Repo variables live in **Settings → Secrets and variables → Actions → Variables**.

See [SETUP.md](SETUP.md) for one-time setup. The bot ships **off** (`BOT_ENABLED` unset) — flip it to
`true` only after you've watched a test PR go through.
