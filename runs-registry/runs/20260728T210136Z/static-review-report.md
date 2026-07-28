## 1. Static Executive Summary

- Static verdict: `FAIL`
- Requirements: `3/9 PASS, 6/9 FAIL, 0/9 BLOCKED`
- Highest-severity findings: the global time/configuration handler is an implicit GLOBAL endpoint that accepts arbitrary issue IDs without an endpoint permission, scoped access control, or `isVisibleTo` check; the GitHub tracker matches the internal issue id rather than the readable issue key and never retrieves Actions runs/jobs.

This was a static-only review. No browser, live YouTrack, upload, or functional testing was performed.

## 2. Environment and Build Results

Run: `20260728T210136Z`  
App: `issue-operations-hub` version `1.0.0`; package ID `issue-operations-hub`  
Host: local macOS workspace (sanitized); no YouTrack host was contacted.  
Tooling: Node `v24.15.0`, npm/npx `11.12.1`; `create-youtrack-app` and `youtrack-app` available.

Pre-review baseline: `git status --short -- .` was empty. A SHA-256 file baseline excluding `.git`, `node_modules`, and `dist` was captured before commands; for example, `manifest.json` was `ac738f1197cc005e1fbf58670ad31d140f6cc9c2a36d58d349bc9c6782ae3faa` and `src/time-tracking-service.js` was `f651fc6f74f4a4faf3a28b892fff3e025f72fe25ae63fa435c2c7ab9abfabee6`.

| Check | Command | Result | Evidence/log |
|---|---|---|---|
| Dependency install | `npm ci` | PASS; 490 packages installed. npm reported 14 high-severity dependency audit findings. | `static-review-evidence/logs/npm-ci.log` |
| Lint | `npm run lint` | FAIL; 31 ESLint errors across handlers, workflows, and widgets. | `static-review-evidence/logs/npm-lint.log` |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | PASS. No documented dedicated typecheck script exists. | `static-review-evidence/logs/tsc.log` (empty successful output) |
| Build and manifest validation | `npm run build` | PASS; Vite built 4 widget entry points and `youtrack-app validate dist` returned `Manifest is valid!` | `static-review-evidence/logs/npm-build.log` |
| Package | `npm run pack` | PASS; produced `issue-operations-hub.zip` (94K) with 31 archive entries. | `static-review-evidence/logs/npm-pack.log`, `package-inspection.log` |
| Archive inspection | `unzip -l issue-operations-hub.zip` | PASS; archive includes manifest, settings, entity extensions, 3 handler/workflow scripts, 4 widgets, and assets. | `static-review-evidence/logs/package-inspection.log` |
| Credential scan | Source-only identifier/literal inspection; environment files were not read | PASS for source inspection: GitHub credential is referenced only as secret setting `githubToken`; no literal credential was found. | `src/settings.json:8`, `src/github-action-service.js:17` |

## 3. Requirement Static Matrix

| ID | Requirement | Static Evidence (path:line or command/log) | Static Result | Notes |
|---|---|---|---|---|
| R-UI-01 | Relation Visualizer: selected issue's real relations/dependencies as node-and-edge graph | `src/widgets/issue-relation-visualizer/app.tsx:7-9`; `manifest.json:17-30` | PASS | Fetches the selected entity's real `links` through YouTrack host API and renders current node plus relation-labelled edges. |
| R-UI-02 | GitHub Action Tracker: complete issue-key PR match and historical Actions runs/statuses | `src/widgets/github-action-tracker/app.tsx:7-9`; `src/github-action-service.js:8-26` | FAIL | Widget passes `YTApp.entity.id`, not readable issue key; service performs only GitHub `/pulls` request and returns PR state, with no workflow-runs/jobs request or display. |
| R-UI-03 | Global Time Logger: select issue and log spent time | `manifest.json:47-60`; `src/widgets/global-time-logger/app.tsx:5-7`; `src/time-tracking-service.js:8-27` | PASS | MAIN_MENU_ITEM interface accepts an issue ID/minutes/description and backend calls native `Issue.addWorkItem`. Backend authorization defect is recorded under R-BE-03. |
| R-UI-04 | Threshold Configurator: dashboard creation and management of issue limits | `manifest.json:62-73`; `src/widgets/critical-threshold-configurator/app.tsx:5-7` | FAIL | Dashboard can blindly save one submitted ID, but contains no retrieval/listing/edit-state/delete interface for existing configured thresholds; it cannot manage existing configuration. |
| R-BE-01 | Email Action: separately invokable and failures handled/reported | `src/workflows/send-critical-time-email.js:4-17` | FAIL | A separate action exists, but `notifications.sendEmail` is not protected by error handling and no success/failure result is reported. |
| R-BE-02 | Critical Time Monitor: every minute, limit status, anti-spam | `src/workflows/critical-time-monitor.js:4-24` | FAIL | One-minute Quartz schedule and transition anti-spam exist, but comparison uses `spent >= limit` and merges equality with above-limit; below/equal/above states are not explicitly handled. |
| R-BE-03 | Time Tracking Service: receive logger entries and save native work items | `src/time-tracking-service.js:8-27`; `src/time-tracking-service.js:26`; handler rules in skill reference `script-types.md:610-645` | FAIL | Native work-item write is present, but endpoint omits scope/permissions and accepts arbitrary issue IDs via `findById` without visibility/authorization verification. Input parsing also accepts partial numeric values via `parseInt`. |
| R-BE-04 | Configuration Storage: user preferences, notification settings, thresholds persisted | `src/settings.json:6-13`; `src/entity-extensions.json:2-20`; `src/time-tracking-service.js:17` | FAIL | Settings and issue extension properties persist notifications/defaults/limits, but no user-preference storage exists; threshold management also shares the unsecured endpoint in R-BE-03. |
| R-DEP-01 | Deployment: deployable package with required modules/permissions | `manifest.json:1-74`; `package.json:6-14`; `static-review-evidence/logs/npm-build.log`; `package-inspection.log` | PASS | `npm run build` passed manifest validation; packaged archive contains widget assets, workflows, handlers, settings, entity extensions, and declared widget permissions. |

## 4. Package and Interface Inventory

- Manifest identity: `issue-operations-hub`, title `Issue Operations Hub`, version `1.0.0`, minimum YouTrack `2024.3.0`.
- Widgets: issue relation visualizer at `ISSUE_BELOW_SUMMARY` (`READ_ISSUE`); GitHub tracker at `ISSUE_ABOVE_ACTIVITY_STREAM` (`READ_ISSUE`); global logger at `MAIN_MENU_ITEM` (`UPDATE_ISSUE`); threshold configurator at `DASHBOARD_WIDGET` (`UPDATE_ISSUE`).
- Backend files: `backend.js` debug GET handler, `github-action-service.js` GET handler, and `time-tracking-service.js` POST handler. None declares endpoint `scope` or endpoint `permissions`, so all default to GLOBAL.
- Workflows: `critical-time-monitor.js` on-schedule rule (`0 * * * * ?`); `send-critical-time-email.js` issue action command `send-critical-time-email`.
- Persistence: `src/settings.json` declares repository/token/recipient/default-limit/notification-enabled configuration; `src/entity-extensions.json` declares issue-level limit/status/last-alert properties.
- Archive: `issue-operations-hub.zip`, 31 entries / 370,106 uncompressed bytes. `dist` contains 25 files and was generated solely as a permitted build artifact.

## 5. Findings

### F-01 / High / R-UI-02

- Summary: GitHub Action Tracker cannot satisfy issue-key matching or historical Actions tracking.
- Inspection steps: Inspect the widget request argument and GitHub handler's outbound paths.
- Expected behavior: Match PR titles containing the complete readable issue key and retrieve/display historical workflow runs/statuses (and jobs as needed).
- Actual behavior: Sends internal `YTApp.entity.id`; calls only `/repos/<repository>/pulls?state=all&per_page=100`; returns PR state only.
- Code evidence: `src/widgets/github-action-tracker/app.tsx:7`; `src/github-action-service.js:8-26`.
- Command or package evidence: Build packages both widget and handler, so this is the shipped behavior (`static-review-evidence/logs/package-inspection.log`).
- Impact: PRs titled with normal readable keys such as `ABC-123` may not match, and users receive no GitHub Actions history/status.

### F-02 / Critical / R-BE-03, R-BE-04

- Summary: Time logging and threshold writes lack server-side access control for arbitrary issue IDs.
- Inspection steps: Inspect endpoint metadata and entity lookup before native work-item/property mutation.
- Expected behavior: Use an ISSUE-scoped endpoint or enforce suitable permissions and issue visibility; strictly validate inputs before mutation.
- Actual behavior: No `scope`, no `permissions`, and no `issue.isVisibleTo(ctx.currentUser)` check accompany `entities.Issue.findById(issueId)`; `parseInt` accepts malformed numeric prefixes.
- Code evidence: `src/time-tracking-service.js:6-27`; no scope/permissions declarations in the endpoint; reference security guidance in `script-types.md:610-645`.
- Command or package evidence: The unscoped handler is included at archive root as `time-tracking-service.js` (`package-inspection.log`).
- Impact: A caller who can reach the global endpoint can attempt to mutate an arbitrary issue or its threshold, contrary to endpoint authorization requirements.

### F-03 / High / R-UI-04, R-BE-04

- Summary: The dashboard does not manage existing thresholds and the app has no user-preference persistence.
- Inspection steps: Inspect dashboard state/effects and persistent-property declarations.
- Expected behavior: Dashboard should retrieve and manage existing issue threshold records; storage should include user preferences as well as notification settings and thresholds.
- Actual behavior: Only an empty issue-ID form posts a new value; no list/read/delete/existing-value load is implemented. Settings are GLOBAL/PROJECT and extension properties are Issue-only.
- Code evidence: `src/widgets/critical-threshold-configurator/app.tsx:5-7`; `src/settings.json:6-13`; `src/entity-extensions.json:2-20`.
- Command or package evidence: Build succeeds, confirming this limited dashboard is the packaged implementation (`npm-build.log`).
- Impact: Administrators cannot review/manage configured limits through the required dashboard, and per-user preferences cannot persist.

### F-04 / Medium / R-BE-01

- Summary: Invokable email action does not handle or report send failures.
- Inspection steps: Inspect action rule around `notifications.sendEmail`.
- Expected behavior: Independently invokable action with explicit failure handling/reporting.
- Actual behavior: Guard only checks that recipients are configured; action directly invokes email with no catch/result/error report.
- Code evidence: `src/workflows/send-critical-time-email.js:4-17`.
- Command or package evidence: `send-critical-time-email.js` is present in the packaged archive (`package-inspection.log`).
- Impact: Users receive no actionable feedback when SMTP or sendout fails.

### F-05 / Medium / R-BE-02

- Summary: Monitor does not explicitly distinguish equal-to-limit from above-limit state.
- Inspection steps: Inspect scheduled rule cadence and status expression.
- Expected behavior: Every-minute monitor explicitly handles below, equal-to, and above-limit cases while avoiding repeated alerts.
- Actual behavior: Quartz cadence is correct and old `critical` status suppresses repeats, but `spent >= limit` makes equality and above-limit indistinguishable.
- Code evidence: `src/workflows/critical-time-monitor.js:7,14-24`.
- Command or package evidence: `critical-time-monitor.js` is in archive (`package-inspection.log`).
- Impact: Current limit status cannot express the specified equality boundary distinctly.

### F-06 / Low / R-DEP-01 (quality gate)

- Summary: The documented lint command fails with 31 errors.
- Inspection steps: Run `npm run lint` after clean dependency installation.
- Expected behavior: Repository lint command exits successfully.
- Actual behavior: ESLint reports 31 errors, including handler complexity/import errors, undefined workflow `exports`, and widget JSX/key errors.
- Code evidence: Examples: `src/time-tracking-service.js:3,7,17`; `src/workflows/critical-time-monitor.js:1-19`; `src/widgets/issue-relation-visualizer/app.tsx:8-9`.
- Command or package evidence: `static-review-evidence/logs/npm-lint.log`.
- Impact: CI quality gate fails even though build/manifest validation passes.

## 6. Blockers and Final Checklist

Unresolved blockers: none. The review could statically inspect all requirements; the result is failure, not blocked.

Commands not run:

- `npm test`: intentionally not run because its documented implementation is only `echo 'no tests'` and supplies no validation.
- Live deployment/upload, browser testing, and functional YouTrack checks: explicitly out of scope for this static-review phase.
- No dedicated `typecheck` npm script exists; an equivalent direct TypeScript command was run successfully.

Source integrity: post-review `git status --short -- .` and `git diff --name-only -- .` were empty. The post-review source-tree aggregate SHA-256 (excluding `.git`, `node_modules`, `dist`, and generated ZIP) was `c7d162f7eb9dc8162f2ea271ddf5d2ccb13d2afd00af081a367c7eb3325565ee`; comparison with the pre-review file baseline found no source changes. Generated artifacts only: `node_modules/`, `dist/`, `issue-operations-hub.zip`, and `static-review-evidence/logs/`.

Checklist status: A01-A05 completed; B01 completed; B02 failed; B03-B05 completed; B06 found no hard-coded source credential or fake production data; B07 failed; B08 passed for native work-item call but is security-failed under R-BE-03; B09 partially verified but failed due missing user preferences; B10 passed; B11 failed; B12 failed; B13 failed; B14 passed for declared extension locations. C01-C04 completed.
