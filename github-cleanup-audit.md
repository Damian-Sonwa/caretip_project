# Git Repository Hygiene Audit

**Project:** CareTip (React + Vite + Node.js + PostgreSQL/Prisma + Supabase)  
**Audit date:** 2026-05-29  
**Tracked files:** ~1,016  
**Remotes:** `company` → Caretip/CareTip, `origin` → Damian-Sonwa/caretip_project  

This document classifies repository paths and recommends actions.  
**Action legend:** **Keep** · **Stop tracking** (`git rm --cached`) · **Move outside repo** · **Add to `.gitignore`**

---

## Immediate credential & exposure review

| Severity | Item | Status | Action |
|----------|------|--------|--------|
| **Medium** | `caretip-postman-environment.json` | **Tracked** — contains demo passwords (`Demo1234!`, `password123`) matching seed accounts | **Stop tracking**; commit `caretip-postman-environment.example.json` with placeholders; rotate if any env ever held real tokens |
| **Medium** | `caretip-service-account.txt` | **Tracked** — empty today; filename invites accidental paste of Firebase SA JSON | **Stop tracking**; add explicit `.gitignore`; never commit service accounts |
| **Low** | `public/firebase-messaging-sw.js`, `public/fcm-sw-handler.js` | Firebase **web client** config (`apiKey`, `projectId`) — public by design | **Keep**; ensure Firebase console domain restrictions; regenerate via `scripts/generate-fcm-sw.mjs` |
| **Low** | `backend/prisma/seed*.ts`, `verifyDemoAccounts.ts` | Hard-coded **demo** passwords for local seeding | **Keep** in code; document that these are non-production |
| **Info** | `.env`, `backend/.env` | **Not tracked** | **Keep** ignored; only `.env.example` files committed |
| **Info** | `.github/workflows/ci.yml` | Placeholder secrets (`ci-test-jwt-secret…`, `sk_test_ci_placeholder`) | **Keep** — CI-only placeholders |
| **Historical** | `caretip-translations.pdf/` (~9.4 MB PDFs) | **Removed** from tree in `21c0281` but **still in git history** | Consider `git filter-repo` / BFG to shrink clone size; **Add to `.gitignore`** if folder returns |

No live `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` values were found in tracked source. Git history shows `caretip-service-account.txt` has always been an empty blob (`e69de29`).

---

## 1. Secrets & credential-shaped files

| Path | Category | Recommendation |
|------|----------|----------------|
| `.env` | Environment secret | **Add to `.gitignore`** (already) · **Keep** untracked |
| `.env.local`, `.env.production`, `.env.*.local` | Environment secret | **Add to `.gitignore`** |
| `.env.example`, `backend/.env.example` | Safe templates | **Keep tracking** |
| `backend/.env` | Environment secret | **Add to `.gitignore`** (backend + root) · **Keep** untracked |
| `caretip-service-account.txt` | Firebase SA slot | **Stop tracking** · **Add to `.gitignore`** |
| `caretip-firebase-sa.txt` | Firebase SA slot | **Add to `.gitignore`** (already) |
| `firebase-service-account.json`, `**/firebase-service-account.json` | Firebase SA | **Add to `.gitignore`** (already) |
| `*service-account*.json`, `*.pem`, `*.p12` | TLS / cloud keys | **Add to `.gitignore`** |
| `FIREBASE_SERVICE_ACCOUNT_JSON_COPY.md` | Accidental paste target | **Add to `.gitignore`** (already) |
| `Untitled` | Accidental paste dump | **Add to `.gitignore`** (already) |
| `caretip-postman-environment.json` | Demo credentials | **Stop tracking** · **Add to `.gitignore`** · replace with `.example` |
| `postman-cookies.json`, `newman-results.json`, `verification-results.json` | Runtime cookies/tokens | **Add to `.gitignore`** (already) |
| `public/firebase-messaging-sw.js` | Public Firebase web config | **Keep tracking** (generated; not a service role key) |

---

## 2. Environment-specific files

| Path | Category | Recommendation |
|------|----------|----------------|
| `.vscode/settings.json` (if local-only overrides) | Editor | **Keep** shared workspace config if team-standard |
| `.cursor/` | IDE local state | **Add to `.gitignore`** (already) |
| `.idea/` | JetBrains | **Add to `.gitignore`** (already) |
| `docker-compose.override.yml` | Local Docker overrides | **Add to `.gitignore`** |
| `.supabase/`, `supabase/.branches`, `supabase/.temp` | Supabase CLI local | **Add to `.gitignore`** |
| `backend/uploads/` | Runtime user uploads | **Add to `.gitignore`** (backend); mirror at root |
| `playwright/.auth/` | Saved login state | **Add to `.gitignore`** |

---

## 3. Generated files

| Path | Category | Recommendation |
|------|----------|----------------|
| `public/firebase-messaging-sw.js` | Generated from env (`scripts/generate-fcm-sw.mjs`) | **Keep tracking** OR generate in CI/build (document choice) |
| `public/fcm-sw-handler.js` | Generated FCM handler | **Keep tracking** (same as above) |
| `caretip-postman-collection.json` | Generated (`scripts/generate-caretip-postman.mjs`) | **Keep tracking** (API contract artifact) |
| `caretip-postman-environment.json` | Generated with secrets | **Stop tracking** · use `.example` only |
| `*.tsbuildinfo` | TypeScript incremental | **Add to `.gitignore`** (already) |
| `.eslintcache` | ESLint cache | **Add to `.gitignore`** (already) |
| `backend/dist/` | Compiled backend | **Add to `.gitignore`** (already) |
| `dist/`, `dev-dist/` | Vite output | **Add to `.gitignore`** (already) |

---

## 4. Build artifacts

| Path | Category | Recommendation |
|------|----------|----------------|
| `node_modules/` | Dependencies | **Add to `.gitignore`** (already) · **Keep** untracked |
| `dist/`, `backend/dist/` | Production bundles | **Add to `.gitignore`** (already) |
| `.vite/`, `dev-dist/` | Vite cache | **Add to `.gitignore`** (already) |
| `coverage/`, `.nyc_output/` | Test coverage | **Add to `.gitignore`** (already) |
| `/test-results/`, `/playwright-report/`, `/blob-report/` | Playwright output | **Add to `.gitignore`** (already) |
| `playwright/.cache/` | Playwright browser cache | **Add to `.gitignore`** (already) |

**Status:** No `node_modules`, `dist`, or Playwright reports are currently tracked.

---

## 5. Temporary & local-only files

| Path | Category | Recommendation |
|------|----------|----------------|
| `.restore_*.txt`, `*.restore_*_report.txt` | Local restore dumps | **Add to `.gitignore`** (already) |
| `.restore_business_profile_report.txt` | Local audit dump (untracked) | **Add to `.gitignore`** (covered by pattern) |
| `*.log` | Runtime logs | **Add to `.gitignore`** (already) |
| `*.tmp`, `*.temp`, `tmp/`, `temp/` | Scratch | **Add to `.gitignore`** |
| `.DS_Store`, `Thumbs.db`, `Desktop.ini` | OS junk | **Add to `.gitignore`** (already) |
| `GDPR*`, `*GDPR*` | Compliance exports | **Add to `.gitignore`** (already) |
| `.qodo/` | Local AI tooling | **Add to `.gitignore`** (already) |

---

## 6. Documentation exports & audit artifacts

| Path | Category | Recommendation |
|------|----------|----------------|
| `*.md` (except allowlist) | Local audit reports | **Add to `.gitignore`** (already) |
| `README.md` | Project docs | **Keep tracking** |
| `github-cleanup-audit.md` | This audit | **Keep tracking** (allowlist exception in `.gitignore`) |
| `docs/hero-layout-audit/*.png` (36 files) | Visual regression / layout screenshots | **Stop tracking** · **Move outside repo** (Drive/Notion) · **Add to `.gitignore`** |
| `docs/api-example-generate-invite.ts` | API snippet | **Keep tracking** (small reference) |
| `period-switch-synchronization-audit.md` | Local audit (untracked) | **Add to `.gitignore`** via `*.md` rule |
| `caretip_adjustment.pdf/Adjustment_Caretip.pdf` (~2.6 MB) | Business PDF export | **Stop tracking** · **Move outside repo** |
| `caretip-translations.pdf/` (historical, ~9.4 MB) | Translation PDF exports | **Add to `.gitignore`** · purge from history with filter-repo |

---

## 7. Large assets & binary hygiene

### Repository bloat (largest historical blobs)

| Blob | ~Size | Tracked now? | Recommendation |
|------|-------|--------------|----------------|
| `caretip-translations.pdf/*.pdf` | 5.4 / 2.3 / 1.7 MB | No (removed) | History cleanup |
| `caretip_adjustment.pdf/Adjustment_Caretip.pdf` | 2.6 MB | **Yes** | **Stop tracking** |
| `images/*.png` (47 files, many 1.4–2.2 MB each) | ~59 MB total est. | **Yes** | See PNG/WebP policy below |
| `images/*.webp` (43 files) | Smaller, production format | **Yes** | **Keep tracking** |
| `docs/hero-layout-audit/*.png` | Multi-MB aggregate | **Yes** | **Stop tracking** |
| `public/fonts/**/*.woff2` | Self-hosted fonts | **Yes** | **Keep tracking** |
| `public/icon-*.png`, `pwa-icon-*.png` | PWA manifest icons | **Yes** | **Keep tracking** |
| `payment_logo/*.jpeg` | Small brand assets | **Yes** | **Keep tracking** |

### PNG vs WebP policy (`images/`)

42 of 47 tracked PNGs have a matching `.webp` sibling also tracked — **duplicate weight**.

| PNG files (no WebP sibling yet) | Recommendation |
|--------------------------------|----------------|
| `bizzy001.png` (untracked locally) | Convert to WebP · **Add to `.gitignore`** `images/*.png` after migration |
| `forbiz.png`, `foremployee.png`, `new_dashboard.png`, `payment-infrastructure.png`, `Screenshot (84).png` | Convert to WebP or keep single format · avoid dual tracking |

**Recommended policy:** Ship **WebP only** in git; **Stop tracking** redundant `images/*.png` where `.webp` exists; add `images/**/*.png` to `.gitignore` after `git rm --cached` cleanup (or keep allowlist for PNG-only assets).

### Other image paths

| Path | Recommendation |
|------|----------------|
| `images/*.jpeg`, `images/*.jpg` | **Keep** if referenced; prefer WebP for new assets |
| `images/FYP.webp` + `FYP.jpeg` | **Stop tracking** duplicate JPEG if WebP is canonical |

---

## 8. Application source — keep tracking

These are correctly versioned and should remain:

| Area | Paths |
|------|-------|
| Frontend app | `src/**`, `index.html`, `vite.config.ts`, `tailwind.config.*`, `tsconfig*.json` |
| Backend API | `backend/src/**`, `backend/prisma/schema.prisma`, `backend/prisma/migrations/**` |
| Root SQL (legacy) | `migrations/001_add_invite_code_to_businesses.sql` — **Keep** or consolidate into Prisma-only |
| Prisma repair scripts | `backend/prisma/repair/*.sql` — **Keep** (operational) |
| CI/CD | `.github/workflows/**` |
| E2E config | `playwright.config.ts`, `e2e/**` (if present) |
| Scripts | `scripts/**`, `backend/scripts/**` |
| i18n | `src/locales/**` or equivalent translation JSON/TS |
| Public static | `public/_redirects`, `public/caretip-font-faces.css`, fonts, icons |
| Postman collection | `caretip-postman-collection.json`, `scripts/generate-caretip-postman.mjs` |
| Package manifests | `package.json`, `package-lock.json`, `backend/package.json` |
| Examples | `.env.example`, `backend/.env.example` |

---

## 9. Untracked local files (current working tree)

| Path | Category | Recommendation |
|------|----------|----------------|
| `images/bizzy001.png` | New asset | Convert to WebP · track WebP only |
| `public/apple-touch-icon.png`, favicons, fonts, FCM SW (if modified) | PWA / fonts | **Keep tracking** after review — align with `scripts/generate-fcm-sw.mjs` |
| `src/app/hooks/useBusinessDashboardStats.ts` | Source | **Keep tracking** — commit when ready |
| `src/app/hooks/useEmployeeDashboardAnalytics.ts` | Source | **Keep tracking** — commit when ready |
| Local `*.md` audit reports | Documentation exports | **Add to `.gitignore`** (already via `*.md`) |

---

## Recommended cleanup commands (do not run blindly)

Review diffs and team impact before executing.

```bash
# 1. Stop tracking credential-shaped / env files
git rm --cached caretip-service-account.txt
git rm --cached caretip-postman-environment.json

# 2. Add example Postman env (placeholders only), then:
#    cp caretip-postman-environment.json caretip-postman-environment.example.json
#    # strip/redact passwords in .example

# 3. Stop tracking doc exports & large PDF
git rm --cached -r docs/hero-layout-audit/
git rm --cached caretip_adjustment.pdf/Adjustment_Caretip.pdf

# 4. Stop tracking redundant PNGs (where .webp exists)
#    Use a script to list pairs, then e.g.:
git ls-files 'images/*.png' | while read png; do
  webp="${png%.png}.webp"
  git cat-file -e "HEAD:$webp" 2>/dev/null && git rm --cached "$png"
done

# 5. Commit .gitignore updates + example files

# 6. Optional: rewrite history to drop large PDFs (coordinate with team)
#    git filter-repo --path caretip-translations.pdf/ --invert-paths
```

If a real Firebase service account or production password was ever committed, **rotate credentials immediately** and rewrite history.

---

## `.gitignore` update summary

The root `.gitignore` was expanded for this stack:

- Explicit `caretip-service-account.txt` and `*service-account*.txt`
- Supabase CLI (`.supabase/`, local branches/temp)
- PostgreSQL dumps (`*.sql.gz`, `*.dump`, local `*.db`)
- Docker local overrides
- Postman env (not collection): `caretip-postman-environment.json`
- Doc audit exports: `docs/**/*-audit/`, `caretip_adjustment.pdf/`, `caretip-translations.pdf/`
- Optional large PNG policy: `images/**/*.png` (commented — enable after WebP migration)
- Playwright auth state, uploads, temp dirs
- Allowlist: `README.md`, `github-cleanup-audit.md`

See root `.gitignore` for the full rule set.

---

## Priority action checklist

1. **Today:** Remove `caretip-postman-environment.json` and `caretip-service-account.txt` from tracking; add `.example` env file.
2. **This week:** Untrack `docs/hero-layout-audit/` and `caretip_adjustment.pdf/`; store externally.
3. **This sprint:** Deduplicate `images/*.png` / `*.webp`; untrack ~42 redundant PNGs (~50+ MB).
4. **When convenient:** `git filter-repo` to drop historical translation PDFs from clone size.
5. **Ongoing:** Never commit `.env`; run `scripts/generate-fcm-sw.mjs` in build if SW config should not be manual.
