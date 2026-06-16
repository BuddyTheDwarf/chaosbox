# chaosbox — one-time setup

Only the things a human must click. The repo itself is already scaffolded and committed locally at
`~/Desktop/Projects/chaosbox`.

## 1. Throwaway GitHub account (recommended, not strictly required)

A public "anyone can merge" experiment is worth isolating from your real identity. If it gets abused,
it's not on `jordanlloydperez@`.

- [ ] Dedicated email (fresh Gmail / Proton), e.g. `chaosbox.deploy@…`.
- [ ] Sign up GitHub with it. Enable 2FA. Use a **separate browser profile** from JD SOL / client work.

> Shortcut if you don't care about isolation: use your existing GitHub account and skip to step 3. You
> lose only the blast-radius separation.

## 2. SSH key for that account (only if you used a separate account)

```sh
ssh-keygen -t ed25519 -C "chaosbox-deploy" -f ~/.ssh/chaosbox_ed25519
```

Add the **public** key (`~/.ssh/chaosbox_ed25519.pub`) to the new account → Settings → SSH keys.
Then tell git which key to use for it, in `~/.ssh/config`:

```
Host github-chaosbox
  HostName github.com
  User git
  IdentityFile ~/.ssh/chaosbox_ed25519
  IdentitiesOnly yes
```

(Your main key stays untouched. Use the `github-chaosbox` host in the remote URL below.)

## 3. Create the repo and push

Create an **empty public** repo named `chaosbox` on the account (no README/license — it's already here).

```sh
cd ~/Desktop/Projects/chaosbox
git branch -M main
# separate-account SSH:
git remote add origin git@github-chaosbox:<account>/chaosbox.git
# …or HTTPS / your main account:
# git remote add origin https://github.com/<account>/chaosbox.git
git push -u origin main
```

Then edit `OWNER/REPO` in `build.mjs` (the "Add yours" link) to your account/repo and push again.

## 4. Vercel

- [ ] Log in to Vercel with **Log in with GitHub** (the chaosbox account).
- [ ] **Set a spending cap** before anything else (Settings → Billing).
- [ ] Import the repo. Framework preset: **Other** (`vercel.json` already sets build + output).
- [ ] Confirm preview deployments are on for PRs (default yes).
- No environment variables needed. If you ever add a secret, scope it to **Production** only.

## 5. Branch protection on `main` (Settings → Branches → Add rule)

- [ ] **Require status checks to pass** → select the `ci` check. (This is what enforces the sandbox.)
- [ ] Require branches up to date before merging.
- [ ] Block force pushes and deletions.
- [ ] **Do NOT** "include administrators" — so you can still push infra fixes to `main` directly.
- Public repos: outsiders can't push anyway (they fork + PR), so no extra access config needed.

## 6. Repo Actions variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value | Meaning |
|----------|-------|---------|
| `BOT_ENABLED` | *(leave unset for now)* | The kill switch. Bot is OFF until this is exactly `true`. |
| `VOTE_THRESHOLD` | `3` | Net 👍−👎 from distinct users to merge. |
| `MIN_PR_AGE_HOURS` | `1` | Minimum PR age before it can merge. |

## 7. Go live

- [ ] Open a test PR (add `contributions/test/index.html`), confirm CI runs + Vercel posts a preview.
- [ ] Give it 3 👍 from distinct accounts, wait past the age window.
- [ ] Set `BOT_ENABLED=true`. Run the **automerge** workflow manually once (Actions → automerge → Run
      workflow) to confirm it merges. Now it self-runs every 10 min.
- [ ] (Optional) throwaway custom domain.

## What you do NOT need (vs. the original plan)

- ❌ **No fine-grained PAT** — the bot uses the built-in `GITHUB_TOKEN`.
- ❌ **No CODEOWNERS** — the required `ci` check is the sandbox guardrail.
- ❌ **No Next.js / framework** — contributions are static HTML; `build.mjs` is the whole build.
