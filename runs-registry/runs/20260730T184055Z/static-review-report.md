# Static Review Report — Issue Delivery Control Center

## 1. Static Executive Summary

- **Static verdict: `FAIL`**
- **Requirements: 3/9 PASS, 6/9 FAIL, 0/9 BLOCKED**
- **Run/app:** `20260730T184055Z` / `issue-delivery-control-center` version `1.0.0` (package ID/name `issue-delivery-control-center`).

Highest-severity findings:

1. **Critical — R-UI-04/R-BE-04:** The dashboard threshold “save” is only React local state. It neither calls a backend nor persists anything, and it presents a hard-coded `DEMO`/`480` claim as saved configuration.
2. **High — R-UI-02:** The GitHub widget only reads YouTrack `pullRequests` and displays PR state. There is no GitHub API request, no workflow-run/job retrieval, and therefore no historical GitHub Actions status tracking.
3. **High — R-UI-01:** The relation response is handled as a `Record<string, Issue[]>`, despite requesting link objects. The rendering calls `.map()` on each link object when links exist; it does not construct a node-and-edge graph from the returned `direction`, `linkType`, and `issues` fields.
4. **High — R-BE-02/R-BE-04:** Monitoring uses one project-level setting rather than issue-specific configured boundaries, so no configured threshold exists per selected issue.

The package is buildable and validates, but validation does not establish that the required features are complete or correctly wired. No live YouTrack or browser functional testing was performed.

## 2. Environment and Build Results

- **Run directory:** `/Users/zoran.repic/Documents/Projects/youtrack-app-agent-kit/system-test/runs/20260730T184055Z`
- **App directory:** `generated-app`
- **Host:** no YouTrack host was used or exposed; review was local-only.
- **Tool availability:** Node `v24.15.0`, npm/npx `11.12.1`, `create-youtrack-app` and `youtrack-app` available. See `static-review-evidence/logs/tool-versions.log`.
- **Framework/package manager:** npm lockfile project; TypeScript/React/Vite widgets plus JavaScript YouTrack workflow and HTTP-handler modules.
- **Documented commands:** `lint`, `build`, `pack`, and `upload` in `package.json:5-12`. There is no dedicated `typecheck` script, so `npx tsc -p tsconfig.app.json --noEmit` was used from the declared TypeScript project.
- **Source integrity:** Pre-review SHA-256 baseline is recorded in `static-review-evidence/logs/pre-review-baseline.log`. The post-review source-only comparison reports `SOURCE_COMPARE=IDENTICAL` in `static-review-evidence/logs/source-integrity-compare.log`. `npm ci` created `node_modules`; build regenerated `dist/`; `npm run pack` created `issue-delivery-control-center.zip`. No authored source, manifest, settings, or package metadata changed.

| Check | Command | Result | Evidence/log |
|---|---|---|---|
| Tool discovery | `node --version; npm --version; npx --version; command -v …` | PASS | `static-review-evidence/logs/tool-versions.log` |
| Pre-review integrity baseline | SHA-256 over app files excluding `.git`/dependencies | PASS | `static-review-evidence/logs/pre-review-baseline.log` |
| JSON syntax | Node `JSON.parse` for manifest/settings/entity extensions | PASS | `static-review-evidence/logs/static-scans.log` |
| Lockfile dry run | `npm ci --dry-run` | PASS | `static-review-evidence/logs/static-scans.log` |
| Dependency installation | `npm ci` | PASS; npm reported 14 high-severity dependency audit findings for the complete dependency tree | `static-review-evidence/logs/npm-ci.log` |
| Production dependency audit | `npm audit --omit=dev --json` | PASS; 0 production dependency vulnerabilities | `static-review-evidence/logs/npm-audit-production.json` |
| Lint | `npm run lint` | PASS | `static-review-evidence/logs/lint.log` |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | PASS | `static-review-evidence/logs/typecheck.log` |
| Build and app validation | `npm run build` | PASS; Vite build completed and `youtrack-app validate dist` printed `Manifest is valid!` | `static-review-evidence/logs/build.log` |
| Package/archive inspection | `npm run pack`; `unzip -l`; `unzip -p … manifest.json` | PASS; 29 archive entries include backend, workflow, settings, manifest, and all widget assets | `static-review-evidence/logs/pack.log` |
| Credential/placeholder scan | Sanitized `rg` scan excluding `.env*` values and build output | FAIL for a fake dashboard status claim; no hard-coded credential value was printed | `static-review-evidence/logs/static-scans.log`; F-001 |
| Post-review integrity baseline | SHA-256 and pre/post source comparison | PASS for authored source; generated artifacts only changed | `static-review-evidence/logs/post-review-baseline.log`, `static-review-evidence/logs/source-integrity-compare.log` |

## 3. Requirement Static Matrix

| ID | Requirement | Static Evidence (path:line or command/log) | Static Result | Notes |
|---|---|---|---|---|
| R-UI-01 | Relation Visualizer: show selected issue’s real relations/dependencies as a node-and-edge graph. | `src/widgets/issue-relation-visualizer/app.tsx:17-21` requests `links(direction,linkType(name),issues(...))`; `:27-30` treats `links` as `Record<string, Issue[]>` and calls `items.map`. | FAIL | Requested links are link objects, but the UI neither consumes `direction`/`linkType`/`issues` nor builds graph edges. For any returned link object, `items.map` is not callable. The only visible arrow is literal text (`:29`), not an edge model. |
| R-UI-02 | GitHub Action Tracker: find PRs whose titles contain complete issue key and show historical GitHub Actions runs/statuses. | `src/widgets/github-action-tracker/app.tsx:16-20` reads YouTrack `pullRequests` and filters `(pr.title || '').includes(issueId)`; `:28-29` renders only PR `state`/`updated`. `static-review-evidence/logs/api-wiring-scan.log` finds no GitHub request/API call. | FAIL | Complete-key title matching is present, but no historical GitHub Actions workflow runs, jobs, or statuses are retrieved or shown. |
| R-UI-03 | Global Time Logger: globally select an issue and log spent time. | `manifest.json:44-58` declares `MAIN_MENU_ITEM` with `UPDATE_ISSUE`; `src/widgets/global-time-logger/app.tsx:16-38` loads selectable issues and posts logger entry; `src/time-tracking-global.js:7-44` validates and saves it. | PASS | Interface and secured handler are wired. Duration is an integer 1–1440 and the issue must be visible to the caller. |
| R-UI-04 | Threshold Configurator: dashboard interface to create/manage critical spent-time limits for issues. | `manifest.json:59-73` declares dashboard widget; `src/widgets/critical-threshold-configurator/app.tsx:7-13` only calls local `setSaved(true)`; no `fetchApp`/`fetchYouTrack` exists in this widget. | FAIL | The UI does not create, update, list, or persist issue thresholds. It persists only component state and includes fake/deployment-specific status text. |
| R-BE-01 | Email Action: separately invokable action that sends an email notification. | `src/workflows/email-action.js:5-25` declares `entities.Issue.action` command `email-time-status` and calls `notifications.sendEmail` at `:17-23`. | FAIL | The action is separately invokable and uses the documented API, but it has no error handling or user-visible failure reporting around mail dispatch. This fails required B13 completeness. |
| R-BE-02 | Critical Time Monitor: every minute compare total spent time with configured boundaries and alert current limit status. | `src/workflows/critical-time-monitor.js:13-37`: `onSchedule`, cron `0 * * * * ?`, calculates spent/percent/state and stores alert state. `src/settings.json:7-13` provides only project-wide `criticalTimeLimitMinutes`. | FAIL | One-minute scheduling and state-based deduplication are present, but there is no issue-specific configured boundary. A single project setting is used for every issue; normal state is also not notified. |
| R-BE-03 | Time Tracking Service: receive logger entries and save them as YouTrack work items on selected issue. | `src/time-tracking-global.js:7-44`, especially validation at `:16-30` and `issue.addWorkItem({...})` at `:36-42`; API reference search confirms work-item duration is minutes in `static-review-evidence/logs/reference-symbol-search.log`. | PASS | Native `Issue.addWorkItem` is used, not app-only storage. Handler declares `UPDATE_ISSUE`, checks visibility, issue existence, project work-item type, and duration. |
| R-BE-04 | Configuration Storage: persist user preferences, notification settings, and issue thresholds. | `src/settings.json:7-35` declares project/global settings only; `src/entity-extensions.json:2-10` declares only `criticalTimeAlertState`; `src/widgets/critical-threshold-configurator/app.tsx:7-13` has no persistence request. | FAIL | Notification settings are schema-backed, but user preferences and issue thresholds are absent. The sole issue extension property is alert state, not a limit. |
| R-DEP-01 | Deployment: package deployable and declares modules/permissions needed for installation/use. | `manifest.json:9-73`; `package.json:7` build invokes `youtrack-app validate dist`; `static-review-evidence/logs/build.log`; archive listing in `static-review-evidence/logs/pack.log`. | PASS | Manifest syntax/validation, four widget declarations, their permissions, packaged HTTP handlers/workflows/settings/entity extensions, and archive contents were verified. |

## 4. Package and Interface Inventory

**Identity and package:** `issue-delivery-control-center`, title **Issue Delivery Control Center**, version `1.0.0`; source manifest at `manifest.json:1-74`. Build produces `dist/`; package creates `issue-delivery-control-center.zip`. The inspected archive contains 29 entries and includes `backend.js`, `time-tracking-global.js`, `critical-time-monitor.js`, `email-action.js`, `settings.json`, `entity-extensions.json`, manifest/icon, four widget HTML/icon pairs, and built assets.

**Manifest widgets and extension points** (`manifest.json:9-73`):

- `issue-relation-visualizer` — `ISSUE_BELOW_SUMMARY`, `READ_ISSUE`.
- `github-action-tracker` — `ISSUE_ABOVE_ACTIVITY_STREAM`, `READ_ISSUE`.
- `global-time-logger` — `MAIN_MENU_ITEM`, `UPDATE_ISSUE`.
- `critical-threshold-configurator` — `DASHBOARD_WIDGET`, `UPDATE_PROJECT`.

**Backend/endpoints:**

- `src/backend.js:1-15`: unrelated `GET /debug` endpoint, with no declared scope/permission.
- `src/time-tracking-global.js:4-44`: global `POST /time-entry`, `UPDATE_ISSUE`, writes a native work item.

**Workflows:**

- `src/workflows/critical-time-monitor.js:13-37`: issue scheduled rule; cron is documented in source as every minute; stores only `criticalTimeAlertState` to suppress repeat same-state notifications.
- `src/workflows/email-action.js:5-25`: issue action command `email-time-status`.

**Settings and storage:** `src/settings.json:7-35` declares project `criticalTimeLimitMinutes`, `notificationEmail`, and `githubRepository`; it declares global secret-formatted `githubToken`. `src/entity-extensions.json:2-10` adds one Issue string property: `criticalTimeAlertState`. There is no declared storage field for user preferences or per-issue threshold values.

**Code-level security and implementation observations:** The time entry endpoint validates caller visibility and bounds before saving (`src/time-tracking-global.js:16-42`). The generic debug endpoint lacks an explicit permission declaration (`src/backend.js:3-14`). No credential values were inspected or reported. The GitHub token schema exists but is never consumed by any source call, and no source GitHub integration exists.

## 5. Findings

### F-001 / Critical / R-UI-04, R-BE-04

- **Summary:** The threshold configurator falsely presents a local dashboard draft as configured threshold management; it does not persist or manage thresholds.
- **Inspection steps:** Inspect `src/widgets/critical-threshold-configurator/app.tsx`; search widget source for backend calls; inspect settings/entity extensions.
- **Expected behavior:** A dashboard user can create/manage critical limits for issues, with input validated and persisted to server-side storage.
- **Actual behavior:** `saveDraft` is only `setSaved(true)` (`app.tsx:9-11`). No issue selection exists. The success text asserts “The deployed DEMO project threshold is configured to 480 minutes” (`:13`) regardless of saved value or deployment state.
- **Code evidence:** `src/widgets/critical-threshold-configurator/app.tsx:7-13`; `src/settings.json:7-35`; `src/entity-extensions.json:2-10`.
- **Command or package evidence:** `static-review-evidence/logs/api-wiring-scan.log` lists no `fetchApp`/`fetchYouTrack` call for this widget; package inspection confirms only the compiled equivalent is deployed.
- **Impact:** Administrators cannot configure real per-issue limits. The displayed confirmation is misleading, and the monitor has no issue-level boundary to apply.

### F-002 / High / R-UI-02

- **Summary:** GitHub Actions tracking is unimplemented.
- **Inspection steps:** Inspect GitHub tracker source and enumerate all production source API/network calls.
- **Expected behavior:** Matching PRs use the complete issue key in their title and have historical GitHub Actions runs/statuses displayed.
- **Actual behavior:** The code filters linked YouTrack PR objects using `includes(issueId)`, then renders PR state and last update only. It neither uses the configured repository/token nor contacts GitHub or reads workflow runs/jobs.
- **Code evidence:** `src/widgets/github-action-tracker/app.tsx:16-20,28-29`; unused settings are at `src/settings.json:22-35`.
- **Command or package evidence:** `static-review-evidence/logs/api-wiring-scan.log` finds only `host.fetchYouTrack` for this widget, with no GitHub URL/client/API call.
- **Impact:** The required historical Action status signal is unavailable.

### F-003 / High / R-UI-01

- **Summary:** The relation visualizer does not correctly transform relation objects into nodes and edges.
- **Inspection steps:** Compare requested response fields with the declared `IssueData`/rendering types and paths.
- **Expected behavior:** The current issue and each real linked/dependent issue are rendered as nodes with relation-direction/type edges.
- **Actual behavior:** The query asks for each link’s `direction`, `linkType(name)`, and `issues`, but the type declares a record of issue arrays. `Object.entries` produces a link object and the render then invokes `items.map`, which is not an array operation on that object. Relation metadata is not rendered.
- **Code evidence:** `src/widgets/issue-relation-visualizer/app.tsx:7,17-21,26-30`.
- **Command or package evidence:** The built archive contains the widget, but `npm run build` only verifies compile/manifest validity, not response-shape correctness (`static-review-evidence/logs/build.log`, `static-review-evidence/logs/pack.log`).
- **Impact:** The widget cannot reliably display linked issues and does not provide the required node-and-edge dependency visualization.

### F-004 / High / R-BE-02, R-BE-04

- **Summary:** Critical-time configuration and monitoring are project-wide, not per issue.
- **Inspection steps:** Inspect monitor setting reads, the settings schema, and declared issue extension properties.
- **Expected behavior:** Each issue can have a configured critical spent-time boundary, and the scheduled monitor compares that issue’s total against its configured boundary.
- **Actual behavior:** The monitor always reads `ctx.settings.criticalTimeLimitMinutes`; that setting is explicitly `PROJECT` scoped. The only Issue extension property stores alert state, not a threshold.
- **Code evidence:** `src/workflows/critical-time-monitor.js:17-27`; `src/settings.json:7-13`; `src/entity-extensions.json:4-8`.
- **Command or package evidence:** `static-review-evidence/logs/reference-symbol-search.log` shows documented use of entity extension properties for app-owned entity state; no threshold property is declared in the package.
- **Impact:** Different issue limits cannot be represented or monitored, contradicting threshold configuration for issues.

### F-005 / Medium / R-BE-01

- **Summary:** The invokable email action does not handle or report email-send failures.
- **Inspection steps:** Inspect the action control flow around `notifications.sendEmail`.
- **Expected behavior:** A separately invokable email action sends notification and handles/reports a failed dispatch.
- **Actual behavior:** `notifications.sendEmail` is called directly; there is no catch, fallback, response/notification to the invoking user, or error logging path.
- **Code evidence:** `src/workflows/email-action.js:11-24`.
- **Command or package evidence:** The notifications API supports the call shape used, as shown in `static-review-evidence/logs/reference-symbol-search.log`; build success in `static-review-evidence/logs/build.log` does not prove SMTP dispatch or failure handling.
- **Impact:** SMTP/configuration errors can leave the caller without an actionable failure result.

### F-006 / Medium / R-DEP-01 (security inventory)

- **Summary:** An unrelated debug endpoint is shipped without declared permission/scope protection.
- **Inspection steps:** Inspect all exported HTTP handler endpoints.
- **Expected behavior:** Production endpoints should have explicit authorization appropriate to their purpose, and no debug-only handler should be shipped unintentionally.
- **Actual behavior:** `GET /debug` accepts a request parameter and returns it with no endpoint `permissions` declaration. It is separate from the secured time-entry handler.
- **Code evidence:** `src/backend.js:1-15` versus `src/time-tracking-global.js:7-12`.
- **Command or package evidence:** Both `backend.js` and `time-tracking-global.js` are present in the built archive (`static-review-evidence/logs/pack.log`).
- **Impact:** Enlarges exposed app surface with an unauthorised/debug behavior. This does not change the R-DEP-01 PASS because package validity was established, but it must be remediated before production deployment.

## 6. Blockers and Final Checklist

**Unresolved blockers:** None prevented static review. There were no `BLOCKED` requirements. Required features failed by direct source evidence.

**Commands not run:**

- No browser/live YouTrack functional tests, deployment/upload, app attachment, workflow invocation, SMTP dispatch, or GitHub API call — prohibited by the review scope and not required for static verdict.
- No documented standalone typecheck command exists; the declared TypeScript project was checked with `npx tsc -p tsconfig.app.json --noEmit`.
- No automated feature test suite exists: `package.json:10` defines `test` as `echo 'no tests'`; it was not used as evidence.

**Generated artifacts:** `node_modules/` from dependency installation, rebuilt `dist/`, and `issue-delivery-control-center.zip` from the documented package command. Archive contents are recorded in `static-review-evidence/logs/pack.log`.

**Source-integrity result:** PASS. Pre/post authored-source hashes match; no source changes were made. See `static-review-evidence/logs/pre-review-baseline.log`, `post-review-baseline.log`, and `source-integrity-compare.log`.

**Checklist completion:**

- A01–A05: completed (paths/context, inventory, baseline, project commands/framework, requirement map).
- B01: completed — dependency install succeeded.
- B02: completed — lint passed.
- B03: completed — TypeScript check passed.
- B04: completed — build, validation, package, and archive inspection passed.
- B05: completed — JSON and manifest validator passed; declarations reviewed.
- B06: completed — fake dashboard production/configuration claim found (F-001).
- B07: completed — time-entry endpoint authorization/input checks verified; unprotected debug endpoint found (F-006); no configuration endpoint exists.
- B08: completed — native work item write verified.
- B09: completed — settings persistence is partial; user preferences and issue thresholds missing.
- B10: completed — scheduled rule and one-minute cron reviewed.
- B11: completed — state logic has normal/warning/critical and repeat suppression, but cannot apply per-issue boundaries.
- B12: completed — complete-key substring check is present; historical GitHub Actions retrieval missing.
- B13: completed — separate action exists; failure handling/reporting missing.
- B14: completed — all four required interfaces are declared in issue, global, and dashboard locations.
- C01–C04: completed — all requirements assigned, defects listed, source integrity captured, and commands not run documented.
