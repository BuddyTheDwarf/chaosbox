# chaosbox

A *modern Chaos*: a live site where anyone opens a PR adding a page under `/contributions`. The crowd
votes 👍/👎 on the PR — enough net 👍 + green CI + an hour of age → a bot auto-merges and the site
redeploys. Spiritual successor to [Chaosthebot/Chaos](https://github.com/Chaosthebot/Chaos), made safe
by Vercel preview deploys + a sandboxed contribution directory + an iframe sandbox.

## How it works

- **Contributions** are static `index.html` files under `contributions/<name>/`. `build.mjs` (zero deps)
  copies them into `public/c/<name>/` and generates the gallery `public/index.html` — each shown in an
  `<iframe sandbox="allow-scripts">`. Untrusted code never builds or runs on the server.
- **CI** (`.github/workflows/ci.yml`, `on: pull_request`) rejects any PR touching files outside
  `/contributions/`, enforces one contribution per PR, and runs the build. Fork-safe, no secrets.
- **The bot** (`.github/workflows/automerge.yml`) runs every 10 min from `main`, tallies distinct
  👍/👎 users on each open PR, and merges when `net ≥ VOTE_THRESHOLD`, CI is green, the PR is older
  than `MIN_PR_AGE_HOURS`, all files are in the sandbox, and the author isn't banned. Built-in
  `GITHUB_TOKEN`, no PAT.
- **Deploy** is Vercel's native GitHub integration: preview per PR, production on merge to `main`.

## The five guardrails

1. **Sandbox dir** — CI + bot both reject anything outside `/contributions/`.
2. **Fork-safe CI** — `pull_request` (never `pull_request_target`); previews see no secrets.
3. **Secrets are Production-scoped** in Vercel (there are none by default).
4. **No PAT** — the bot uses the built-in `GITHUB_TOKEN`, scoped via the workflow `permissions:` block.
5. **Branch protection on `main`** + Vercel spending cap + the bot's per-PR age/vote gate.

## Controls

| What | Where |
|------|-------|
| **Kill switch** | Repo variable `BOT_ENABLED`. Bot does nothing unless it's exactly `true`. Set it to `false` to freeze merges instantly. |
| **Vote threshold** | Repo variable `VOTE_THRESHOLD` (default 3). |
| **Min PR age** | Repo variable `MIN_PR_AGE_HOURS` (default 1). |
| **Ban list** | `bot/banlist.txt`, one username per line. |
| **Panic** | Set `BOT_ENABLED=false`, then `git revert` bad merges on `main` (Vercel redeploys the good state). |

> Repo variables live in **Settings → Secrets and variables → Actions → Variables**.

## First-time setup

See [SETUP.md](SETUP.md) for the one-time manual checklist (account, repo, Vercel, branch protection,
variables). The bot ships **off** (`BOT_ENABLED` unset) — flip it to `true` only after the kill switch
and branch protection are in place.
