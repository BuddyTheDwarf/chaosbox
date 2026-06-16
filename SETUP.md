# chaosbox — setup

How this instance is wired, in case you want to fork the idea.

## 1. Throwaway GitHub account (recommended)

A public "anyone can merge" experiment is worth isolating from your real identity: fresh email,
separate browser profile, 2FA. Lock the repo's git identity so you never commit as yourself:

```sh
git config user.name  "<account>"
git config user.email "<id>+<account>@users.noreply.github.com"   # GitHub's private noreply
```

## 2. Push the repo

Create an empty **public** repo and push. The first push needs a token with `repo` + `workflow`
scopes (classic) — `workflow` is required to push the `.github/workflows/*` files. The merge bot
itself never uses a PAT; it runs on the built-in `GITHUB_TOKEN`.

## 3. Enable GitHub Pages

**Settings → Pages → Source = GitHub Actions.** `pages.yml` then publishes `public/` on every push to
`main`. Production lands at `https://<account>.github.io/<repo>/`. No phone, no host account, no card.

## 4. Branch protection (Settings → Branches → add rule for `main`)

- Require status check: **`guard`**.
- Block force-pushes and deletions; require linear history.
- Do **not** enforce for admins (so you can still push infra fixes to `main`).

## 5. Actions variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value | Meaning |
|----------|-------|---------|
| `BOT_ENABLED` | *(leave unset until ready)* | Kill switch. Bot is off unless this is exactly `true`. |
| `VOTE_THRESHOLD` | `3` | Net 👍−👎 from distinct users to merge. |
| `MIN_PR_AGE_HOURS` | `1` | Minimum PR age before merge. |

## 6. Go live

- Open a test PR adding `contributions/test/index.html`. The preview bot comments a live link.
- Approve the CI run (GitHub asks for first-time fork contributors) and confirm `guard` goes green.
- Get it past the vote threshold + age window.
- Set `BOT_ENABLED=true`, run the **automerge** workflow once manually to confirm, then it self-runs
  every 10 min.

## Not needed (vs. the usual setup)

- ❌ No deploy host account (Vercel/Netlify/Cloudflare) — GitHub Pages covers production, and
  `raw.githack.com` covers per-PR previews. (Cloudflare Pages won't preview fork PRs anyway.)
- ❌ No fine-grained PAT for the bot — built-in `GITHUB_TOKEN`.
- ❌ No CODEOWNERS — the required `guard` check is the sandbox guardrail.
