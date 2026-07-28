# Static Review Report — Ops Command Center

## 1. Static Executive Summary

- **Static verdict: `PASS`**
- **Requirements: 9/9 PASS, 0/9 FAIL, 0/9 BLOCKED**
- The generated app builds, type-checks, packages, and passes manifest schema validation. All four required interfaces (Relation Visualizer, GitHub Action Tracker, Global Time Logger, Threshold Configurator) and all four backend modules (Email Action, Critical Time Monitor, Time Tracking Service, Configuration Storage) are implemented with real YouTrack REST / scripting-API calls, not placeholders or fake data. API usage (`addWorkItem`, `onSchedule`+cron, `notifications.sendEmail`, extension properties, scoped/global HTTP handlers, host `fetchApp`/`fetchYouTrack`) matches the ground-truth references.
- **No blocking defects.** Highest-severity findings are non-blocking:
  - **F-01 (Medium):** the global `config` HTTP handler has no scope and no permission guard — any authenticated user reaching the app can overwrite global critical thresholds/preferences (authorization gap, B07).
  - **F-02 (Medium):** GitHub PR matching relies on GitHub's fuzzy `in:title` search and never post-filters titles to confirm they contain the *complete* issue key (B12).
  - **F-03 (Low/Med):** `npm run lint` fails (38 errors) — a mix of eslint-config gaps for backend `src/workflows/*.js` (CommonJS `require`/`exports` false-positives) and real style violations.
- Source integrity: **unchanged** — 35 tracked source files have identical SHA-256 before and after review; no app source files were edited.

## 2. Environment and Build Results

- Run: `20260728T222414Z` · App package `name`: `ops-command-center` · `title`: "Ops Command Center" · `version`: `0.0.0`
- Host: darwin (Node `v24.15.0`, npm `11.12.1`); `youtrack-app` CLI available on PATH.
- Framework: TypeScript app (Vite 6 + React 18 + Ring UI) with file-based CommonJS backend (workflow rules + HTTP handlers). Package manager: npm. Manifest format: `manifest.json` (schema `https://json.schemastore.org/youtrack-app.json`).
- Source integrity: baseline vs post-review checksums **identical** (`static-review-evidence/logs/baseline-checksum.txt`, `postreview-checksum.txt`). `git status` shows no app-source changes (only untracked build artifacts: `dist/`, `node_modules/`, `ops-command-center.zip`).
- Secrets: no hard-coded tokens/credentials in `src`; `githubToken` is a `format: secret` setting read via `ctx.settings`; `.env.local` is git-ignored (`*.local`). No secret values are reproduced in this report.

| Check | Command | Result | Evidence/log |
| --- | --- | --- | --- |
| Install deps | `npm install` | PASS (exit 0) | `logs/npm-install.log` |
| Lint | `npm run lint` | **FAIL (exit 1, 38 errors)** | `logs/lint.log` |
| Type check | `tsc -p tsconfig.app.json` (via `npm run build`) | PASS (no type errors) | `logs/build.log` |
| Build (frontend) | `vite build` | PASS — 74 modules, 4 widget bundles | `logs/build.log` |
| Manifest validation | `youtrack-app validate dist` | PASS — "Manifest is valid!" | `logs/build.log` |
| Package | `npm run pack` (bestzip) | PASS — `ops-command-center.zip`, 34 files | `logs/pack.log` |

## 3. Requirement Static Matrix

| ID | Requirement | Static Evidence (path:line or command/log) | Static Result | Notes |
| --- | --- | --- | --- | --- |
| R-UI-01 | Relation Visualizer (node/edge graph of real relations) | `src/widgets/issue-relations/app.tsx:56` (`GET issues/{id}/links?fields=direction,linkType(...),issues(...)`); SVG center+related nodes, edges, relation labels `:98-137`; manifest widget `ISSUE_ABOVE_ACTIVITY_STREAM` `manifest.json:13-27` | PASS | Real link data; radial single-hop layout renders nodes+edges+relation labels. Handles empty/error/loading states. |
| R-UI-02 | GitHub Action Tracker (PR title contains complete issue key; historical runs) | `src/github.js:57` (`/search/issues q=repo type:pr in:title <issueId>`), PR branch → `/actions/runs` `:84-102`; UI `src/widgets/github-actions/app.tsx:52` | PASS | Works; see **F-02** — no post-filter to guarantee title contains the *complete* key. Historical runs (status/conclusion/event/time) shown. |
| R-UI-03 | Global Time Logger (global select-issue + log time) | `manifest.json:44-53` `MAIN_MENU_ITEM`; `src/widgets/time-logger/app.tsx:39` issue search, `:61` POST `time-tracking/log-time` | PASS | Global menu widget; search → select → minutes+description → submit. |
| R-UI-04 | Threshold Configurator (dashboard manage critical limits) | `manifest.json:55-62` `DASHBOARD_WIDGET`; `src/widgets/threshold-config/app.tsx:35`(GET),`:71`(POST) add/remove/save per-issue thresholds | PASS | Dashboard CRUD over per-issue thresholds. Shares the config endpoint's authz gap (**F-01**). |
| R-BE-01 | Email Action (invokable email notification) | `src/workflows/email-action.js:17` `entities.Issue.action` cmd `send-status-email`; `notifications.sendEmail(...)` `:38-43` | PASS | Separately invokable command; guard requires configured email. See **F-04** (no failure handling). |
| R-BE-02 | Critical Time Monitor (every minute, compare, alert with status) | `src/workflows/critical-time-monitor.js:41` `entities.Issue.onSchedule`, `cron '0 * * * * ?'` `:44`, compare `:53`, status-change alert `:57-73` | PASS | Cron = every minute (matches reference). Anti-spam via `lastCriticalStatus` extension property; equal-to folded into `>= limit` → CRITICAL. |
| R-BE-03 | Time Tracking Service (save native work items) | `src/time-tracking.js:16` global httpHandler POST `log-time`; `issue.addWorkItem(description, Date.now(), ctx.currentUser, minutes)` `:46` | PASS | Writes native `IssueWorkItem` (duration in minutes — matches `entities.md:3262/4236`). Validates issueId & positive minutes; checks `isVisibleTo`. |
| R-BE-04 | Configuration Storage (persist prefs/settings/thresholds) | `src/config.js:26` GET/POST `config`; `ctx.globalStorage.extensionProperties.thresholds/preferences` `:49-53`; `src/entity-extensions.json:4-12`; `src/settings.json` (notification settings) | PASS | Server-side persistence via AppGlobalStorage + app settings. See **F-01** (write authz gap) and **F-06** (preferences global, not per-user). |
| R-DEP-01 | Deployment (deployable; declares modules/permissions) | `youtrack-app validate dist` → "Manifest is valid!"; `dist/` contains all backend `.js` + `settings.json` + `entity-extensions.json` + manifest + 4 widget bundles; widgets declare `READ_ISSUE` `manifest.json:20-22,35-37` | PASS | Packages cleanly (`ops-command-center.zip`, 34 files). Backend HTTP handlers/workflows are file-based modules (auto-discovered, not manifest-listed — framework norm). |

## 4. Package and Interface Inventory

- **App identity:** `ops-command-center` / "Ops Command Center" / v`0.0.0`; icon `icon.svg`; vendor `VendorName`.
- **Widgets (4):**
  - `issue-relations` → `ISSUE_ABOVE_ACTIVITY_STREAM`, perms `[READ_ISSUE]`, 600×420
  - `github-actions` → `ISSUE_ABOVE_ACTIVITY_STREAM`, perms `[READ_ISSUE]`, 600×420
  - `time-logger` → `MAIN_MENU_ITEM` (global), 520×480, no perms declared
  - `threshold-config` → `DASHBOARD_WIDGET`, no perms declared
- **Backend workflow rules (2):** `email-action.js` (`Issue.action`, command `send-status-email`); `critical-time-monitor.js` (`Issue.onSchedule`, cron every minute).
- **HTTP handlers (3):** `time-tracking.js` (GLOBAL, POST `log-time`), `config.js` (GLOBAL, GET/POST `config`), `github.js` (scope `issue`, GET `actions`).
- **Settings (`settings.json`):** `notificationEmail` (email), `senderName`, `enableEmailAlerts` (bool), `defaultCriticalMinutes` (int ≥1), `githubRepo`, `githubApiBase`, `githubToken` (secret). `required: []`.
- **Extension properties (`entity-extensions.json`):** `AppGlobalStorage.thresholds`, `AppGlobalStorage.preferences` (string), `Issue.lastCriticalStatus` (string).
- **Permissions:** widget-level `READ_ISSUE` on the two issue widgets; no endpoint-level `permissions` declared on any HTTP handler.
- **Archive (`ops-command-center.zip`, 34 files):** manifest.json, settings.json, entity-extensions.json, icon.svg, 3 backend handlers, 2 workflow rules, 4 widget `index.html`, 4 widget icons, widget JS/CSS asset bundles.

## 5. Findings

### F-01 / Medium / R-BE-04 (also R-UI-04, B07)
- **Summary:** The global Configuration Storage HTTP handler has no `scope` and no `permissions`; any authenticated caller can overwrite global critical thresholds and preferences.
- **Inspection steps:** Read `src/config.js:26-59`; note the endpoint object declares only `method`/`path`/`handle` with no `scope` (defaults to GLOBAL) and no `permissions`. Compare with `references/script-types.md:531-644` (scope/permissions guidance for global handlers).
- **Expected behavior:** Writing global critical-time thresholds/preferences should require an administrative permission (declared endpoint `permissions`) or be gated behind a scoped/admin check.
- **Actual behavior:** POST `config/config` mutates `ctx.globalStorage.extensionProperties.thresholds/preferences` for the whole installation with no authorization check.
- **Code evidence:** `src/config.js:36-56`.
- **Command/package evidence:** Endpoint packaged in `dist/config.js`; manifest validation does not check handler authz.
- **Impact:** Any user who can load the dashboard widget can change or clear the critical-time limits that drive the monitor's alerts. Functionality is present; hardening is missing.

### F-02 / Medium / R-UI-02 (B12)
- **Summary:** GitHub PR matching does not verify that a returned PR title contains the *complete* issue key.
- **Inspection steps:** Read `src/github.js:57-75`; the query is `repo:<repo> type:pr in:title <issueId>` and results (`items`) are consumed directly with no `item.title.includes(issueId)` filter.
- **Expected behavior:** Per R-UI-02, only PRs whose title contains the complete issue key (e.g. `DEMO-123`) should match.
- **Actual behavior:** GitHub tokenizes hyphenated terms, so `in:title DEMO-123` can match titles containing `DEMO` and `123` separately; matches are not re-checked client-side.
- **Code evidence:** `src/github.js:57-75`.
- **Command/package evidence:** N/A (no live GitHub call in static review).
- **Impact:** Possible false-positive PRs in the tracker; "complete issue key" guarantee is not enforced. Historical run retrieval itself (`:84-102`) is correct.

### F-03 / Low-Medium / Code quality (B02)
- **Summary:** `npm run lint` fails with 38 errors.
- **Inspection steps:** `npm run lint` → exit 1 (`logs/lint.log`); review `eslint.config.mjs`.
- **Expected behavior:** Lint passes (script uses `--max-warnings 0`).
- **Actual behavior:** 38 errors. Two classes: (a) **config gap** — `eslint.config.mjs:66-74` adds Node globals only for `src/*.js`, not `src/workflows/*.js`, so correct CommonJS `require`/`exports` in the two workflow rules are reported as `no-require-imports` / `'exports' is not defined` (false positives); (b) **real style issues** — `complexity`, `no-magic-numbers`, `func-names`, `camelcase` (`per_page`), `react/no-array-index-key`, unused `e`, `no-console`, `no-void`.
- **Code evidence:** `eslint.config.mjs:66-74`; `src/github.js`, `src/workflows/*.js`, widget `app.tsx` files (see log).
- **Command/package evidence:** `logs/lint.log`.
- **Impact:** No functional/build impact (build + type-check + validate all pass). Quality gate is red; backend files are not correctly scoped in the lint config.

### F-04 / Low / R-BE-01 (B13)
- **Summary:** Email action does not handle/report send failures.
- **Inspection steps:** Read `src/workflows/email-action.js:23-44`; `notifications.sendEmail(...)` is called without try/catch and without success/failure feedback.
- **Expected behavior:** SMTP/send failures should be caught and surfaced (e.g. `workflow.message` / logged) rather than throwing and rolling back the command silently.
- **Actual behavior:** A send exception propagates and rolls back the action with no explicit user-facing report.
- **Code evidence:** `src/workflows/email-action.js:38-43`.
- **Impact:** Minor operability gap; the action is invokable and functions on the happy path.

### F-05 / Low / R-UI-02 (scope casing)
- **Summary:** `github.js` uses `scope: 'issue'` (lowercase) while the references document uppercase `scope: 'ISSUE'`.
- **Inspection steps:** `src/github.js:41` vs `references/script-types.md:562,637`.
- **Expected behavior:** Scope literal matching the documented casing.
- **Actual behavior:** Lowercase literal. The widget call `host.fetchApp('github/actions', {scope: true})` is correct; whether YouTrack accepts lowercase is not verifiable statically (manifest validation does not cover handler code).
- **Code evidence:** `src/github.js:41`; `src/widgets/github-actions/app.tsx:52`.
- **Impact:** Potential scope-resolution mismatch at runtime; flagged for functional confirmation.

### F-06 / Low / R-BE-04 (B09)
- **Summary:** "User preferences" are persisted as a single shared global blob, not per-user.
- **Inspection steps:** `src/config.js:52-53` writes `ctx.globalStorage.extensionProperties.preferences` (one AppGlobalStorage value for the whole app).
- **Expected behavior:** If preferences are per-user, they should be scoped per user; as-is they are global/shared.
- **Actual behavior:** All callers read/write the same global `preferences` object.
- **Code evidence:** `src/config.js:18-24,52-54`; `src/entity-extensions.json:4-12`.
- **Impact:** Acceptable for shared config; mismatched if per-user preferences were intended.

## 6. Blockers and Final Checklist

- **Blockers:** None. All requirements were statically verifiable; no `BLOCKED` results.
- **Source integrity:** UNCHANGED — 35 source files, identical SHA-256 baseline vs post-review (`logs/baseline-checksum.txt` == `logs/postreview-checksum.txt`); no app source edited.
- **Generated artifacts:** `dist/` (rebuilt), `node_modules/` (installed), `ops-command-center.zip` (packaged) — build outputs only, all git-ignored.
- **Commands not run (with reason):**
  - `npm test` — project defines it as `echo 'no tests'`; no test suite exists to run.
  - `youtrack-app upload/enable/attach`, live GitHub/SMTP calls, browser rendering — out of scope for static review (require a live YouTrack instance / external services / functional phase).
- **Checklist status:** A01–A05 ✅; B01 ✅, B02 ✅(ran; result FAIL — F-03), B03 ✅, B04 ✅, B05 ✅, B06 ✅, B07 ⚠️ (config endpoint authz gap — F-01), B08 ✅, B09 ✅ (global scope; F-06 note), B10 ✅, B11 ✅ (equal-to treated as ≥limit CRITICAL; anti-spam via status change), B12 ✅ (with F-02 gap), B13 ✅ (invokable; F-04 error-handling gap), B14 ✅; C01–C04 ✅.
- **Unchecked checklist items:** None outstanding beyond the noted findings.

### Evidence logs
`static-review-evidence/logs/`: `npm-install.log`, `lint.log`, `build.log`, `pack.log`, `baseline-checksum.txt`, `postreview-checksum.txt`.
