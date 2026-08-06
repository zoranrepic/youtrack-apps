# Static Review Report — Issue Insight Suite

Run: `20260730T173549Z`
App directory: `/Users/zoran.repic/Documents/Projects/youtrack-app-agent-kit/system-test/runs/20260730T173549Z/generated-app`
Evidence: `/Users/zoran.repic/Documents/Projects/youtrack-app-agent-kit/system-test/runs/20260730T173549Z/static-review-evidence/logs`
Review type: static only (no live YouTrack / browser testing).

## 1. Static Executive Summary

- Static verdict: **FAIL**
- Requirements: **7/9 PASS, 2/9 FAIL, 0/9 BLOCKED**
- Highest-severity findings:
  - **S1 (High, R-BE-04):** `POST backend/config` is a `GLOBAL` HTTP endpoint with no `permissions` declaration and no admin/role check. Any authenticated YouTrack user who can load the dashboard widget can overwrite global critical/warning limits, the `notifyOnCritical` flag, and the notification recipient email list (arbitrary external addresses receiving issue data).
  - **S2 (High, R-BE-04):** Threshold input validation accepts `NaN` and negative hours; `Number('abc')` passes the `typeof === 'number'` guard and is persisted as `null` by `JSON.stringify`, silently resetting the stored limits.
  - **S3 (High, R-UI-02):** GitHub matching never verifies that the PR title actually contains the complete issue key (relies on the tokenized, unquoted GitHub search term only), and workflow-run history is limited to the PR's **current** `head_sha`, so runs from earlier commits of the PR are not shown.
  - **S4 (Medium, R-BE-03):** `POST backend/time-tracking` is a `GLOBAL` endpoint accepting an arbitrary `issueId`; it checks read visibility (`isVisibleTo`) but never checks a write/work-item permission, so a read-only user can create native work items.
  - **S5 (Medium, build hygiene):** The documented `npm run lint` command fails with 59 errors, i.e. the project's own quality gate does not pass.

## 2. Environment and Build Results

- Host: local macOS workstation (no YouTrack host contacted in this phase).
- App: `issue-insight-suite` / title `Issue Insight Suite`; `manifest.json` declares **no `version`** (defaults to `0.0.0`), no `minYouTrackVersion`.
- Tooling: Node (mise 24.15.0), npm, `@jetbrains/youtrack-apps-tools@0.1.3` (linked workspace copy; `package.json` pins `^0.0.1` → `npm ls` reports `invalid`), TypeScript 5.9.3, Vite 6.4.3, ESLint 9.39.5.
- Source integrity: pre-review baseline `logs/pre-checksums.txt` (40 files), post-review `logs/post-checksums.txt`. **All app source files (`src/**`, `@types/**`, `public/**`, `manifest.json`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.mjs`) are byte-identical before and after review.** New files appearing in the directory (`.playwright-mcp/*`, `D0*.png`, `F01-*.png`) were produced by the concurrent functional-review phase, not by this review. This review generated only `dist/` and `issue-insight-suite.zip` (allowed build artifacts).

| Check | Command | Result | Evidence/log |
|---|---|---|---|
| Dependency tree | `npm ls --depth=0` | PARTIAL — installed, but `@jetbrains/youtrack-apps-tools@0.1.3 invalid: "^0.0.1"`, `@jetbrains/youtrack-workflow-types` extraneous | `logs/npm-ls.txt` |
| Lint | `npm run lint` | **FAIL** — 59 errors (`no-undef 'exports'` in both workflow files, `no-require-imports`, `no-console`, `complexity`, `no-magic-numbers`, `camelcase`) | `logs/lint.txt` |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | PASS (exit 0, no diagnostics) | `logs/typecheck.txt` |
| Build + manifest validate | `npm run build` (`tsc` → `vite build` → `youtrack-app validate dist`) | PASS — “Manifest validation passed”, 4 widget bundles emitted | `logs/build.txt` |
| Package | `npm run pack` (bestzip → `issue-insight-suite.zip`) | PASS — 33 entries, backend/workflow scripts, `settings.json`, `entity-extensions.json`, `manifest.json`, `icon.svg`, 4 widget dirs | `logs/pack.txt`, `logs/zip-contents.txt` |
| Secret scan | `grep -rniE "token *= *['\"]|password|secret|ghp_|api[_-]?key"` over `src`, `@types`, `manifest.json` | PASS — only `settings.json:41 "format": "secret"`; `.env.local` is **not** included in `dist/` or the zip | shell output; `logs/zip-contents.txt` |
| Tests | `npm test` | Not run — script is `echo 'no tests'` (no test suite exists) | `package.json:11` |

## 3. Requirement Static Matrix

| ID | Requirement | Static Evidence (path:line or command/log) | Static Result | Notes |
|---|---|---|---|---|
| R-UI-01 | Relation Visualizer | `src/widgets/issue-relation-visualizer/app.tsx:78-85` (real `fetchYouTrack('issues/{YTApp.entity.id}', fields=links(direction,linkType(...),issues(...)))`); graph rendering `:110-152` (SVG `<line>` edges + `<circle>` nodes, radial layout `:46-67`); manifest widget `manifest.json:11-25` `ISSUE_ABOVE_ACTIVITY_STREAM` + `READ_ISSUE`; bundle in package `logs/zip-contents.txt` | PASS | Real link types and directions (`relationName` at `:39-44`); no mock data. Node click uses relative `../../issue/{id}` (minor). |
| R-UI-02 | GitHub Action Tracker | `src/github.js:46-49` search `q: 'repo:X is:pr in:title ' + issueId` with **no** title-contains verification; `src/github.js:64-69` runs fetched only for `head_sha`; widget `src/widgets/github-action-tracker/app.tsx:54,102-121` | **FAIL** | See Finding S3: complete-issue-key match is not enforced and run history is limited to the current head commit only. |
| R-UI-03 | Global Time Logger | `manifest.json:39-49` `MAIN_MENU_ITEM`; issue search `src/widgets/global-time-logger/app.tsx:37-39`; submit `:56-64` → `host.fetchApp('backend/time-tracking', POST)`; server write `src/backend.js:65-71` | PASS | Global page, real issue search, real POST; minutes/date/description captured. |
| R-UI-04 | Threshold Configurator | `manifest.json:50-56` `DASHBOARD_WIDGET`; load `src/widgets/critical-threshold-configurator/app.tsx:44`; save `:57-89`; project overrides `:68-76,124-149` | PASS | Create/update works. Gap (Finding S6, Low): backend supports `removeProject` (`src/backend.js:117-121`) but the UI never sends it — overrides cannot be deleted. |
| R-BE-01 | Email Action | `src/workflows/email-action.js:19-22` `entities.Issue.action({title:'Send time report email', command:'send-time-report-email', guard})`; `:41-46` `notifications.sendEmail({fromName,to,subject,body}, issue)`; packaged as `email-action.js` (`logs/zip-contents.txt`) | PASS | Separately invokable via command/Show-more menu. Finding S7 (Low): no `try/catch` around `sendEmail`; only the "no recipients" failure is reported via `workflow.message` (`:26-30`). |
| R-BE-02 | Critical Time Monitor | `src/workflows/critical-time-monitor.js:36-40` `entities.Issue.onSchedule({search:'has: {Spent time}', cron:'0 * * * * ?' // every minute})`; comparison `:47-53`; alert `:66-79` | PASS | Below/equal/above handled (`>= criticalHours` → CRITICAL, `>= warningHours` → WARNING, else OK); anti-spam via persisted `issue.extensionProperties.criticalTimeStatus` early return `:55-58`; alert text states current limit and status `:60-62`. |
| R-BE-03 | Time Tracking Service | `src/backend.js:38-79`: validates `issueId`/`minutes` (`:46-52`), resolves via `entities.Issue.findById` and `issue.isVisibleTo(ctx.currentUser)` (`:54-61`), creates a native work item `issue.addWorkItem({description,date,author,duration})` (`:64-70`), returns recomputed totals from `issue.workItems` (`:28-35`) | PASS | Native YouTrack work items, not app-only storage. Finding S4 (Medium): `GLOBAL` scope with a caller-supplied issue ID and only a read-visibility check — no write permission check and contrary to the `scope: 'ISSUE'` guidance. |
| R-BE-04 | Configuration Storage | `src/entity-extensions.json:10-17` `AppGlobalStorage.thresholdConfig`; read `src/backend.js:8-23`; write `src/backend.js:25-27,123`; consumed by monitor `src/workflows/critical-time-monitor.js:7-26`; app settings schema `src/settings.json` (recipients, notify flag, limits, GitHub repo/token as `format: secret`) | **FAIL** | Findings S1 + S2: unauthenticated-by-role global write endpoint (any user can rewrite limits and recipient addresses) and no numeric validation (NaN/negative accepted, NaN serialized to `null`). Also global-only: no per-user preference scope despite “user preferences”. |
| R-DEP-01 | Deployment | `npm run build` → “Manifest validation passed” (`logs/build.txt`); `npm run pack` → 33-entry archive with `manifest.json`, `settings.json`, `entity-extensions.json`, `backend.js`, `github.js`, `critical-time-monitor.js`, `email-action.js`, 4 widget dirs (`logs/zip-contents.txt`); widget permissions `manifest.json:20-22,36-38` | PASS | Deployable. Minor: `manifest.json` has no `version` (defaults `0.0.0`) and no `minYouTrackVersion` despite using extension properties / `issue.url`. |

## 4. Package and Interface Inventory

**Manifest (`manifest.json`)** — `name: issue-insight-suite`, `title: Issue Insight Suite`, vendor `Insight Labs`, `icon: icon.svg`, `$schema` set; no `version`, no min/max YouTrack version. Widgets:

| Key | Extension point | Index | Permissions | Dimensions |
|---|---|---|---|---|
| `issue-relation-visualizer` | `ISSUE_ABOVE_ACTIVITY_STREAM` | `issue-relation-visualizer/index.html` | `READ_ISSUE` | expected 700×420 |
| `github-action-tracker` | `ISSUE_ABOVE_ACTIVITY_STREAM` | `github-action-tracker/index.html` | `READ_ISSUE` | expected 700×420 |
| `global-time-logger` | `MAIN_MENU_ITEM` | `global-time-logger/index.html` | — (none declared) | expected 800×500 |
| `critical-threshold-configurator` | `DASHBOARD_WIDGET` | `critical-threshold-configurator/index.html` | — (none declared) | none (correct: `expectedDimensions` is rejected for `DASHBOARD_WIDGET`) |

Interface coverage vs. requirement locations: issue context ✔ (2 widgets), global page ✔ (`MAIN_MENU_ITEM`), dashboard ✔ (`DASHBOARD_WIDGET`) — B14 satisfied.

**HTTP handlers** (auto-discovered from package root, no manifest entry required):

| File | Endpoint | Method | Scope | Declared permissions |
|---|---|---|---|---|
| `backend.js` | `time-tracking` | POST | `GLOBAL` | none |
| `backend.js` | `config` | GET | `GLOBAL` | none |
| `backend.js` | `config` | POST | `GLOBAL` | none |
| `github.js` | `github` | GET | `ISSUE` | none (inherits issue visibility) |

**Workflow scripts:** `critical-time-monitor.js` (`Issue.onSchedule`, cron `0 * * * * ?`, `search: 'has: {Spent time}'`, `muteUpdateNotifications: true`), `email-action.js` (`Issue.action`, command `send-time-report-email`, guard `ctx.issue.isReported`).

**Settings (`src/settings.json`, draft-07):** `notificationRecipients` (string), `notifyOnCritical` (boolean, default true), `warningSpentTimeHours` (number, min 0, default 6), `criticalSpentTimeHours` (number, min 0, default 8), `githubRepository` (string), `githubToken` (string, `format: secret`). No `required` entries.

**Extension properties (`src/entity-extensions.json`):** `Issue.criticalTimeStatus: string`; `AppGlobalStorage.thresholdConfig: string` (JSON-stringified config — documented supported pattern).

**Archive (`issue-insight-suite.zip`, 33 entries, ~400 KB):** root `manifest.json`, `settings.json`, `entity-extensions.json`, `icon.svg`, `backend.js`, `github.js`, `critical-time-monitor.js`, `email-action.js`; `widgets/<key>/index.html` + `widget-icon.svg` ×4; `widgets/assets/*` bundles. No `.env`, no source maps, no credentials.

## 5. Findings

### S1 / High / R-BE-04
- **Summary:** The configuration write endpoint performs no authorization check.
- **Inspection steps:** Read `src/backend.js:82-126`; compare with `skills/youtrack-app-builder/references/script-types.md:549` (`permissions` on endpoints) and `:640-647` (security/visibility rules).
- **Expected behavior:** A global endpoint that mutates app-wide alert limits and notification recipients declares a `permissions` requirement (e.g. admin/update-app permission) or checks `ctx.currentUser` role before writing.
- **Actual behavior:** `POST config` has `scope: 'GLOBAL'` and no `permissions`; `handle` writes `ctx.globalStorage.extensionProperties.thresholdConfig` for any caller. The configurator is a `DASHBOARD_WIDGET` available to ordinary users, so any user can raise/lower critical limits for everyone or redirect the alert emails to arbitrary external addresses.
- **Code evidence:** `src/backend.js:82-88` (endpoint declaration), `src/backend.js:123` (`writeConfig`), `src/backend.js:25-27`, `manifest.json:50-56` (dashboard widget, no permissions).
- **Command or package evidence:** `logs/zip-contents.txt` — `backend.js` shipped at package root; `logs/build.txt` — validation does not check authorization.
- **Impact:** Privilege escalation and data exfiltration channel (issue summaries/links emailed to attacker-chosen recipients); monitoring can be silently disabled.

### S2 / High / R-BE-04
- **Summary:** Threshold values are not validated for finiteness or sign.
- **Inspection steps:** Read `src/backend.js:96-112`; trace widget input `src/widgets/critical-threshold-configurator/app.tsx:62-76` where free-text numeric fields are converted with `Number(...)`.
- **Expected behavior:** Reject non-finite and negative hour values with HTTP 400 (the settings schema already declares `minimum: 0`).
- **Actual behavior:** `typeof body.warningHours === 'number'` is true for `NaN` (`Number('abc')`) and for negatives. `NaN` passes the only guard (`criticalHours < warningHours` is false for NaN), is written via `JSON.stringify` as `null`, and on the next read fails `typeof stored.x === 'number'`, silently reverting to defaults; negative limits make every issue permanently CRITICAL. Project-override hours (`body.projectWarningHours`, `body.projectCriticalHours`, `src/backend.js:114-122`) receive no validation at all, not even the warning-vs-critical ordering check.
- **Code evidence:** `src/backend.js:99-107`, `src/backend.js:109-112`, `src/backend.js:114-122`, `src/backend.js:25-27`.
- **Command or package evidence:** `npx tsc -p tsconfig.app.json --noEmit` passes (`logs/typecheck.txt`) — backend `.js` is untyped, so no compiler safety net.
- **Impact:** Corrupted or nonsensical alert configuration; alert storms or silently disabled monitoring.

### S3 / High / R-UI-02
- **Summary:** PR matching does not require the complete issue key in the title, and workflow-run history is truncated to the current head commit.
- **Inspection steps:** Read `src/github.js:36-96`; compare with R-UI-02 wording ("title contains the complete issue key", "historical GitHub Actions runs").
- **Expected behavior:** Filter GitHub results so that only PRs whose `title` literally contains the full issue key (e.g. `DEMO-12`) are shown, and retrieve the run history of the PR (all runs associated with the PR/branch), not only the latest commit.
- **Actual behavior:** The query `repo:<r> is:pr in:title <issueId>` is sent unquoted to `/search/issues`; GitHub tokenizes the term, so returned items are not guaranteed to contain the complete key, and the handler performs no `item.title.indexOf(issueId) >= 0` verification before returning results. Runs are requested only with `head_sha: details.head.sha` (`src/github.js:64-69`), so once a PR receives a new commit all previous runs disappear from the widget; if `headSha` is null the run list is empty.
- **Code evidence:** `src/github.js:46-49` (search, no post-filter), `src/github.js:57-59` (`items.map` returns everything the search returned), `src/github.js:62-77` (head-sha-only runs), widget rendering `src/widgets/github-action-tracker/app.tsx:99-121` (claims "No workflow runs found for the head commit").
- **Command or package evidence:** `logs/zip-contents.txt` — `github.js` (3509 B) is the only GitHub code path in the package; no alternative branch-based query exists.
- **Impact:** False positives (unrelated PRs) and loss of historical run/status data — the requirement's core value is not delivered.

### S4 / Medium / R-BE-03
- **Summary:** Work-item creation endpoint checks visibility but not write authorization, and uses a global scope with a caller-supplied issue ID.
- **Inspection steps:** Read `src/backend.js:38-79`; compare with `references/script-types.md:640-643` ("use `scope: 'ISSUE'` instead of accepting an arbitrary issue ID") and `:549` (`permissions`).
- **Expected behavior:** Either an `ISSUE`-scoped endpoint or a `GLOBAL` endpoint declaring a work-item/update permission, so that only users allowed to modify the issue can add spent time.
- **Actual behavior:** `scope: 'GLOBAL'`, no `permissions`; the only gate is `issue.isVisibleTo(ctx.currentUser)` (`src/backend.js:55`). Handler code runs with elevated script privileges, so a read-only user can create a native work item attributed to themselves on any visible issue. `date` handling accepts any parseable string including far-future/past dates (`src/backend.js:63,67`), and there is no upper bound on `minutes`.
- **Code evidence:** `src/backend.js:40-44`, `src/backend.js:54-61`, `src/backend.js:64-70`.
- **Command or package evidence:** `logs/zip-contents.txt` (`backend.js` at root, global handler URL shape `/api/extensionEndpoints/issue-insight-suite/backend/time-tracking`).
- **Impact:** Time-tracking data can be written by users without update rights; audit/billing integrity risk.

### S5 / Medium / build hygiene (affects R-DEP-01 maintainability, not deployability)
- **Summary:** The project's documented lint gate fails.
- **Inspection steps:** `npm run lint` (exit 1).
- **Expected behavior:** `eslint --max-warnings 0` passes for shipped source.
- **Actual behavior:** 59 errors. Notably `'exports' is not defined  no-undef` at `src/workflows/critical-time-monitor.js:40` and `src/workflows/email-action.js:19` — the ESLint config only grants Node globals to `src/*.js` (`eslint.config.mjs:55-63`), not `src/workflows/*.js`; plus `no-console`, `complexity`, `no-magic-numbers`, `camelcase` (GitHub API `per_page`/`head_sha`).
- **Code evidence:** `eslint.config.mjs:55-63`; `logs/lint.txt`.
- **Command or package evidence:** `logs/lint.txt` (full output).
- **Impact:** The generated app cannot pass its own CI quality gate as delivered.

### S6 / Low / R-UI-04
- **Summary:** Project-override deletion is implemented in the backend but unreachable from the UI.
- **Inspection steps:** Compare `src/backend.js:117-121` (`removeProject === true` branch) with the configurator's request body construction.
- **Expected behavior:** The dashboard interface can remove an obsolete project threshold.
- **Actual behavior:** `src/widgets/critical-threshold-configurator/app.tsx:62-76` never sets `removeProject`; overrides are rendered read-only as a list (`:143-149`) with no delete/edit control. Dead backend code path.
- **Code evidence:** `src/backend.js:117-121`, `src/widgets/critical-threshold-configurator/app.tsx:62-76,143-149`.
- **Command or package evidence:** n/a (source inspection).
- **Impact:** Incomplete lifecycle management of thresholds; requirement's "create" and "update" parts still work.

### S7 / Low / R-BE-01
- **Summary:** Email send failures are not caught or reported.
- **Inspection steps:** Read `src/workflows/email-action.js:26-49`.
- **Expected behavior:** Wrap `notifications.sendEmail` in `try/catch` and surface a user-visible `workflow.message` on failure.
- **Actual behavior:** Only the "no recipients configured" case is handled (`:26-30`); an SMTP/notification failure propagates as an unhandled workflow exception with no user feedback. The same applies to the monitor's send at `src/workflows/critical-time-monitor.js:75-79`.
- **Code evidence:** `src/workflows/email-action.js:41-49`; `src/workflows/critical-time-monitor.js:75-79`.
- **Command or package evidence:** n/a (source inspection).
- **Impact:** Silent/opaque delivery failures.

### S8 / Low / R-DEP-01
- **Summary:** Manifest and dependency metadata gaps.
- **Inspection steps:** Read `manifest.json:1-10`; run `npm ls --depth=0`.
- **Expected behavior:** Explicit `version` and a `minYouTrackVersion` consistent with the APIs used (extension properties, `issue.url`, app HTTP handlers); dependency ranges that resolve cleanly.
- **Actual behavior:** No `version` (defaults to `0.0.0`, so upgrades are indistinguishable) and no `minYouTrackVersion`; `npm ls` exits 1 with `@jetbrains/youtrack-apps-tools@0.1.3 invalid: "^0.0.1"` and an extraneous `@jetbrains/youtrack-workflow-types`.
- **Code evidence:** `manifest.json:1-9`, `package.json:26`.
- **Command or package evidence:** `logs/npm-ls.txt`; `logs/build.txt` (validation still passes).
- **Impact:** Version confusion on upgrade; install may fail on older YouTrack instances.

## 6. Blockers and Final Checklist

**Unresolved blockers:** none — every requirement was statically decidable.

**Commands not run and why:**
- `npm test` — script is a stub (`echo 'no tests'`); no test suite exists to execute.
- `npm run upload` / `youtrack-app upload dist` — deployment to a live YouTrack instance is out of scope for the static phase (functional phase owns it).
- `npm run dev` — requires a live host/browser session; out of scope.
- Any browser/live functional verification (widget rendering, real GitHub calls, real email sendout) — explicitly excluded from this phase.

**Source-integrity result:** App source unchanged. `diff` of the pre/post checksum baselines restricted to app source paths reports no differences (`APP SOURCE UNCHANGED`). Extra files present post-review (`.playwright-mcp/*.log|*.yml`, `D01-installed-app.png`, `D02-app-technical-details.png`, `D03-app-demo-project.png`, `F01-relation-visualizer.png`) originate from the concurrent functional-review phase and were not created or modified by this review.

**Generated artifacts (allowed):** `dist/` (rebuilt by `npm run build`), `issue-insight-suite.zip` (created by `npm run pack`), and evidence logs `static-review-evidence/logs/{pre-checksums.txt,post-checksums.txt,npm-ls.txt,lint.txt,typecheck.txt,build.txt,pack.txt,zip-contents.txt}`.

**Checklist status:**
- Completed: A01, A02, A03, A04, A05, B01, B02, B03, B04, B05, B06, B07 (result: defects S1/S2/S4), B08, B09, B10, B11, B12 (result: defect S3), B13 (result: defect S7), B14, C01, C02, C03, C04.
- Unchecked items: none.

**Final static verdict: FAIL** — R-UI-02 and R-BE-04 fail static review.
