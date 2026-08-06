## 1. Static Executive Summary

- Static verdict: `FAIL`
- Requirements: `2/9 PASS, 7/9 FAIL, 0/9 BLOCKED`
- Highest-severity findings: the global configuration endpoints have no declared authorization and let any caller overwrite app-wide limits; the GitHub tracker does not retrieve GitHub Actions history; and the relation visualizer is a textual list rather than a node-and-edge graph. The declared lint check also fails with 34 errors.

This was a source/build/package review only. No browser or live YouTrack functional testing was run.

## 2. Environment and Build Results

- Run: `20260728T133948Z`; app directory: `generated-app`; package ID: `issue-operations-suite`; version: `1.0.0`.
- Host path was sanitized to the supplied local run directory. Node `v24.15.0`, npm/npx `11.12.1`, `create-youtrack-app`, and `youtrack-app` were available.
- Pre-review source baseline was a per-file SHA-256 inventory. All originally inventoried app source files had identical checksums after review; the stable source-tree digest (source/config files, excluding `.env.local`, dependencies, build products, and external `.playwright-mcp` artifacts) is `414f8dbd8925b1a2341f3d9ea6868e02a9b762bd944ad6735fbcacc6e7e03ac0` after review and corresponds to the unchanged pre-review file inventory. `npm ci` added `node_modules`; build added `dist/` and `issue-operations-suite.zip`. Pre-existing/externally-created `.playwright-mcp/` artifacts appeared after the initial inventory and were excluded from the app-source comparison. No generated-app source file was edited.

| Check | Command | Result | Evidence/log |
|---|---|---|---|
| Dependency install | `npm ci` | PASS; 490 packages installed. npm reported 14 high vulnerabilities. | `static-review-evidence/logs/npm-ci.log` |
| Lint | `npm run lint` | FAIL; 34 errors across handlers, workflows, and widgets. | `static-review-evidence/logs/lint.log` |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | PASS | `static-review-evidence/logs/typecheck.log` |
| Production build + manifest validation | `npm run build` | PASS; Vite built four widget entries and `youtrack-app validate dist` reported `Manifest is valid!` | `static-review-evidence/logs/build.log` |
| Package | `npm run pack` | PASS; ZIP created | `static-review-evidence/logs/pack.log` |
| Archive inspection | `unzip -l issue-operations-suite.zip` | PASS; archive has manifest, settings, entity extensions, handlers/workflows, and widget assets | `static-review-evidence/logs/archive-contents.log` |

## 3. Requirement Static Matrix

| ID | Requirement | Static Evidence (path:line or command/log) | Static Result | Notes |
|---|---|---|---|---|
| R-UI-01 | Relation Visualizer: selected issue's real relations/dependencies as node-and-edge graph | `src/widgets/issue-relations/app.tsx:15` retrieves real links; `:21-28` renders a center label and grouped text spans, with no edge element/geometry. | FAIL | Real relation data is fetched, but the required graph is not implemented. |
| R-UI-02 | GitHub Action Tracker: complete issue-key PR-title match and historical GitHub Actions runs/statuses | `src/widgets/github-actions/app.tsx:14-17` requests only `pullRequests`; `:16` accepts every PR with `idReadable`; `:24-29` displays PR state and a statement about history, not runs/jobs. | FAIL | Matching is broadened beyond a complete title match and no GitHub workflow run/job API is called. |
| R-UI-03 | Global interface to select issue and log spent time | UI: `src/widgets/time-logger/app.tsx:7-27`; backing endpoint: `src/time-tracking.js:6-30`; no endpoint `permissions` declaration at `:6-8`. | FAIL | The interface and native write call exist, but the global mutating endpoint lacks explicit authorization/permission enforcement. |
| R-UI-04 | Dashboard interface to create/manage critical spent-time limits for issues | Dashboard declaration `manifest.json:48-53`; form only exposes global limit/settings `src/widgets/critical-thresholds/app.tsx:25-30`; server stores only `AppGlobalStorage` values `src/time-tracking.js:45-47`. | FAIL | No issue selector, issue identifier, or per-issue threshold record exists. |
| R-BE-01 | Invokable email-notification action | `src/workflows/email-action.js:3-16` declares action command `email-time-status` and calls `sendMail`; no `try/catch` or user-visible failure handling. | FAIL | Separately invokable, but delivery failures are neither handled nor reported. |
| R-BE-02 | One-minute monitor compares total time with boundaries and alerts current limit status | `src/workflows/critical-time-monitor.js:3-23`, especially Quartz cron `:6`, status comparison `:12`, transition check `:13`, and state persistence `:22`. | PASS | Handles normal/warning/critical states; equality is critical (`>=`), and state transition check suppresses repeated alerts at an unchanged non-normal state. |
| R-BE-03 | Receive logger entries and save native YouTrack work items | `src/time-tracking.js:9-30`, especially validation `:12-20` and `issue.addWorkItem` `:23-29`; API reference identifies `addWorkItem.duration` as minutes. | FAIL | Native work-item write is present, but the global mutation endpoint declares no permissions; it only checks issue visibility. |
| R-BE-04 | Persist user preferences, notification settings, and issue thresholds | Settings schema `src/settings.json:7-39`; persistent global properties `src/entity-extensions.json:13-24`; endpoint writes `src/time-tracking.js:45-47`. | FAIL | Settings/global persistence exists, including a secret-formatted token, but no user-scoped preferences and no per-issue threshold persistence are implemented; config endpoint is unprotected. |
| R-DEP-01 | Deployable package declaring modules/permissions needed | `manifest.json:1-56`; `package.json:7-13`; successful `npm run build` validation; package listing in `static-review-evidence/logs/archive-contents.log`. | PASS | Manifest validates and archive contains all widget assets plus settings, entity extensions, HTTP handlers, and workflow scripts. No widget-specific permissions are declared, but source inspection does not establish a required missing permission for package installation. |

## 4. Package and Interface Inventory

- Identity: `issue-operations-suite` / **Issue Operations Suite**, `1.0.0`, minimum YouTrack `2026.1.0` (`manifest.json:2-12`).
- Widgets: issue relation visualizer at `ISSUE_BELOW_SUMMARY`; GitHub tracker at `ISSUE_ABOVE_ACTIVITY_STREAM`; global logger at `MAIN_MENU_ITEM`; threshold configurator at `DASHBOARD_WIDGET` (`manifest.json:15-54`). No widget `permissions` fields are declared.
- Workflows: `critical-time-monitor.js` exports an `Issue.onSchedule` rule; `email-action.js` exports an `Issue.action` rule. The built archive includes both at its root.
- Endpoints: `backend.js` exposes unused `GET debug`; `time-tracking.js` exposes global `POST time-log`, `POST critical-config`, and `GET critical-config`. None declare scope or permissions; omitted scope is global.
- Settings and persistence: `settings.json` provides global critical/warning/notification/GitHub settings; `githubToken` is secret-formatted/global. Entity extensions declare one Issue alert-state string and three global configuration properties. There is no User extension/property and no per-Issue limit property.
- Archive: 33 entries, including `manifest.json`, `settings.json`, `entity-extensions.json`, all three handler/workflow files, icons, four widget HTML entries, and compiled JS/CSS assets. See `static-review-evidence/logs/archive-contents.log`.

## 5. Findings

### F-01 / High / R-UI-02

- Summary: GitHub Action Tracker neither performs the required complete-key title match nor retrieves historical GitHub Actions runs/statuses.
- Inspection steps: Inspect `src/widgets/github-actions/app.tsx` and search the project for workflow-run/job requests.
- Expected behavior: Filter PRs by a complete issue key in their titles, then retrieve and display historical GitHub Actions run/job status for each matching PR.
- Actual behavior: The only request asks YouTrack for linked `pullRequests`; the filter accepts any PR with `idReadable`, and UI renders only PR state.
- Code evidence: `src/widgets/github-actions/app.tsx:14-17,24-29`.
- Command or package evidence: Compiled GitHub widget is present in `static-review-evidence/logs/archive-contents.log`, confirming this is the packaged implementation.
- Impact: The tracker can show unrelated linked PRs and cannot fulfill its core workflow-history purpose.

### F-02 / High / R-UI-04, R-BE-04

- Summary: Threshold configuration is global, unprotected, and not per issue.
- Inspection steps: Inspect dashboard form, endpoint input/storage, and entity extension declarations.
- Expected behavior: Authorized users can manage critical limits for individual issues, with preferences/notification settings stored under appropriate user/global scope.
- Actual behavior: Any caller of global `critical-config` may set three app-wide values; the form has no issue selection; no User or Issue threshold property exists.
- Code evidence: `src/widgets/critical-thresholds/app.tsx:25-30`; `src/time-tracking.js:34-59`; `src/entity-extensions.json:2-25`.
- Command or package evidence: Package includes these files; `npm run build` validates only manifest structure (`static-review-evidence/logs/build.log`).
- Impact: One user can overwrite settings for all users/issues, and issue-specific time limits cannot be represented.

### F-03 / High / R-UI-03, R-BE-03

- Summary: The global work-log endpoint writes work items without an explicit endpoint permission requirement.
- Inspection steps: Inspect the `POST time-log` endpoint header and authorization checks.
- Expected behavior: A mutating global endpoint enforces authentication/authorization and validates issue/duration input before writing a work item.
- Actual behavior: Input and issue visibility are validated, but the endpoint at `src/time-tracking.js:6-30` declares neither `permissions` nor an authorization check for adding work items.
- Code evidence: `src/time-tracking.js:6-30`.
- Command or package evidence: API guidance states endpoint `permissions` are available and global handlers do not inherit project/entity visibility; see the inspected skill reference `script-types.md` HTTP-handler security section. Package contains the endpoint (`archive-contents.log`).
- Impact: A caller who can reach the app's global endpoint may attempt an unauthorized mutation of a visible issue; static review cannot establish safe permission enforcement.

### F-04 / High / R-UI-01

- Summary: The relation visualizer is not a node-and-edge graph.
- Inspection steps: Inspect the relation widget's rendered JSX and CSS/source asset scan.
- Expected behavior: Render selected issue and linked issues as nodes joined by edges representing relations/dependencies.
- Actual behavior: It renders a center `<div>`, relation names, and `<span>` labels; no SVG/canvas/edge elements or layout calculations exist.
- Code evidence: `src/widgets/issue-relations/app.tsx:21-28`.
- Command or package evidence: The built widget asset is included in `archive-contents.log`.
- Impact: Users cannot visually inspect relation topology/dependencies as required.

### F-05 / Medium / R-BE-01

- Summary: The email action has no failure handling/reporting.
- Inspection steps: Inspect `email-action.js` action body.
- Expected behavior: The invokable action reports mail-delivery failures to the user or logs/handles them safely.
- Actual behavior: It directly calls `sendMail` with no error path.
- Code evidence: `src/workflows/email-action.js:9-16`.
- Command or package evidence: The packaged `email-action.js` is listed in `archive-contents.log`.
- Impact: Invocation can fail without a controlled, reported outcome.

### F-06 / Medium / Build quality

- Summary: The documented lint command fails.
- Inspection steps: Run `npm run lint` after `npm ci`.
- Expected behavior: Declared lint check exits successfully.
- Actual behavior: 34 errors, including undefined workflow `exports`, forbidden `require`, JSX formatting, and complexity errors.
- Code evidence: Affected files are enumerated in the lint output.
- Command or package evidence: `static-review-evidence/logs/lint.log`.
- Impact: The project does not pass its own static quality gate despite a successful TypeScript/Vite build.

## 6. Blockers and Final Checklist

- Unresolved blockers: none. Static evidence proved failures; no result is `BLOCKED`.
- Commands not run: no browser/live YouTrack functional tests, upload/deployment, or runtime API calls; excluded by review scope. `npm test` was not run because `package.json:10` defines it as `echo 'no tests'`, so it offers no validation. No audit command was run; `npm ci` reported 14 high vulnerabilities but did not attribute them to a dependency path.
- Source-integrity result: source files in the pre-review checksum inventory were unchanged after review. Generated artifacts were limited to `node_modules/`, `dist/`, `issue-operations-suite.zip`, and requested evidence logs; no source repair was performed.
- Generated artifacts: `dist/`, `issue-operations-suite.zip`, and `static-review-evidence/logs/{npm-ci,lint,typecheck,build,pack,archive-contents}.log`.
- Checklist status: A01-A05 complete; B01 complete; B02 failed; B03-B05 complete; B06 failed (placeholder/unsupported GitHub-history claim); B07 failed; B08 implementation confirmed but authorization failed; B09 failed; B10 complete; B11 complete; B12 failed; B13 failed; B14 interface declarations complete but interface behavior failed; C01-C04 complete.
