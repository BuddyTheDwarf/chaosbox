# Contributing to chaosbox

1. **Fork** this repo.
2. Add **one** folder: `contributions/<your-name>/index.html`. It's a single, self-contained HTML
   page (inline CSS/JS is fine). It will be shown on the wall inside a sandboxed `<iframe>`
   (`allow-scripts` only — no cookies, no network to us, no access to the parent page).
3. **Open a PR.** CI checks that you only touched `/contributions/` and that the site still builds.
4. **Rally votes.** People react 👍 / 👎 on your PR. Once **net 👍 ≥ the threshold**, CI is green,
   and the PR is at least an hour old, a bot squash-merges it and it goes live automatically.

## Rules

- One contribution per PR.
- Touch nothing outside `/contributions/` — CI will reject it.
- Keep it self-contained. No build step, no external dependencies you control.
- Be decent. Maintainer can revert anything and ban repeat offenders.
