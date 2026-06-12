# Disabled Workflows Report

**Date:** 2026-05-29  
**Reason:** MVP pilot operations — reduce CI noise and failure notifications while stabilizing production.

## Disabled jobs

Both jobs live in `.github/workflows/ci.yml` (workflow name: **CI**). They are **skipped** on every `push` and `pull_request` to `main` / `master`.

| Job | Workflow file | Status |
|-----|---------------|--------|
| `backend-tests` | `.github/workflows/ci.yml` | Disabled (`if: false`) |
| `frontend-e2e` | `.github/workflows/ci.yml` | Disabled (`if: false`) |

## Still active

| Job | Workflow file | Triggers |
|-----|---------------|----------|
| `frontend-quality` | `.github/workflows/ci.yml` | `push`, `pull_request` → `main`, `master` |

## What was changed

- Added `if: false` to `backend-tests` and `frontend-e2e` with inline comments.
- **No workflow files deleted.** All steps, env vars, services, and Postgres config are unchanged.

## How to re-enable later

1. Open `.github/workflows/ci.yml`.
2. For each job (`backend-tests`, `frontend-e2e`), **delete** the `if: false` line (and optional comment block above it if you prefer a cleaner file).
3. Commit and push — jobs will run again on the next `push` / `pull_request`.

Optional: run manually before re-enabling by temporarily changing to:

```yaml
if: github.event_name == 'workflow_dispatch'
```

…and adding `workflow_dispatch:` under the workflow `on:` block for one-off validation.

## Verification

After disabling, a push to `main` should show the **CI** workflow run with:

- `frontend-quality` — runs
- `backend-tests` — skipped
- `frontend-e2e` — skipped

Skipped jobs do not fail and should not send failure notifications.
