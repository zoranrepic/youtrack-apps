# Static Review Report — Issue Ops Suite

- Run: `20260728T211622Z`
- Generated app: `/Users/zoran.repic/Documents/Projects/youtrack-app-agent-kit/system-test/runs/20260728T211622Z/generated-app`
- Reviewer phase: independent static review (source, dependency/build commands, package inspection)
- Evidence: `static-review-evidence/logs/`

---

## 1. Static Executive Summary

- **Static verdict: `FAIL`**
- **Requirements: 5/9 PASS, 4/9 FAIL, 0/9 BLOCKED**

The app is a genuinely implemented, coherent YouTrack app: four real widgets, two real HTTP handler modules, two real workflow rules, a real settings schema, and real extension-property declarations. Type checking passes, the build succeeds, the manifest validates against the SchemaStore schema, and the packaged archive has the correct YouTrack app layout. There is **no fake data, no placeholder handler, and no hard-coded credential** anywhere in the source or the package. The time logger writes native YouTrack work items, the monitor is a real one-minute scheduled rule, and the relation graph renders real `issues/{id}/links` data.

Four requirements nevertheless fail static review:

**Highest-severity findings**

1. **F-01 (High) — declared YouTrack compatibility floor is wrong, silently breaking three features.** `manifest.json:11` declares `minYouTrackVersion: "2025.3.0"`, but the code uses `Project.isTimeTrackingEnabled`, which is `Since: 2026.1`. On any YouTrack from 2025.3 up to 2026.1 the app installs successfully and then (a) rejects **every** time-log request with HTTP 400 and (b) never enables the email action command. Fails `R-DEP-01`; conditionally disables `R-UI-03`, `R-BE-01`, `R-BE-03`.
2. **F-02 (High) — non-admin threshold management is broken by construction.** The configurator widget tells non-admins their project and issue limits are still editable, then the backend rejects the save with HTTP 403 whenever the loaded configuration contains any override outside the user's own projects. Fails `R-UI-04`.
3. **F-03 (Medium) — no user-scoped persistence exists at all.** `R-BE-04` requires user preferences to be persisted; `entity-extensions.json` declares only `Issue` and `AppGlobalStorage`, and no per-user value is written anywhere. Fails `R-BE-04`.
4. **F-04 / F-05 (Medium) — GitHub PR matching produces both false positives and undisclosed false negatives.** Unbounded substring matching makes issue `DEMO-1` match PRs titled `DEMO-12 …`, and only the 100 most recently updated PRs are ever scanned, with the widget reporting a definitive "no pull request has this ID in its title". Fails `R-UI-02`.

**Major blockers:** none. All required tooling was available and every documented command was executed.

**Note on scope overlap:** the parallel functional-review phase was writing into the app directory while this review ran (`.playwright-mcp/`, `F04-github-matching-error.png`). Those files are not mine and are excluded from the integrity baseline; all 38 pre-existing source files are byte-identical before and after this review.

---

## 2. Environment and Build Results

| Item | Value |
|---|---|
| App name / title | `issue-ops-suite` / `Issue Ops Suite` |
| App version | **absent from manifest** (defaults to `0.0.0`) — see F-09 |
| `minYouTrackVersion` | `2025.3.0` — incorrect, see F-01 |
| Package manager | npm (no `package-lock.json` was committed; `npm ci` unusable, `npm install` used) |
| Manifest format | `manifest.json` + `$schema: https://json.schemastore.org/youtrack-app.json` |
| Framework | Vite 6 + React 18 + TypeScript + `@jetbrains/ring-ui-built` (vite-app scaffold) |
| Sanitized host | not referenced by any packaged file; only `.env.local` (gitignored, unpackaged) holds host/token keys |

Tool availability: node `v24.15.0` (note: `.nvmrc` pins `20.18.0`), npm `11.12.1`, tsc `5.9.3`, eslint `9.39.5`, vite `6.4.3`, `@jetbrains/youtrack-apps-tools` `0.0.1` (local, provides `youtrack-app validate`).

**Source integrity:** pre-review baseline `logs/checksum-pre.txt` (38 files, SHA-256); post-review `logs/checksum-post.txt`. All 38 pre-existing files unchanged (0 modifications, 0 deletions). No source file was edited by this review.

| Check | Command | Result | Evidence/log |
|---|---|---|---|
| Dependency install (lockfile) | `npm ci` | **FAIL** — no `package-lock.json` in the app | `logs/npm-ci.log` |
| Dependency install | `npm install` | PASS (exit 0) | `logs/npm-install.log` |
| Lint | `npm run lint` | **FAIL** — exit 1, 111 errors across 8 files | `logs/lint.log` |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | PASS (exit 0, no diagnostics) | `logs/typecheck.log` |
| Build + manifest validate | `npm run build` | PASS (exit 0; `Manifest is valid!`) | `logs/build.log` |
| Package | `npm run pack` | PASS (exit 0; `issue-ops-suite.zip`, 33 entries, 114 KB) | `logs/pack.log`, `logs/archive-listing.txt` |
| Tests | `npm test` | No tests exist — script is `echo 'no tests'` | `package.json:11` |
| Manifest schema audit | SchemaStore `youtrack-app.json` (cached) | PASS — all 4 `extensionPoint` values and `READ_ISSUE` are in the schema enums; required `key/name/indexPath/extensionPoint` all present | §4 |
| Credential / placeholder scan | `grep -rniE "token\|secret\|password\|api[_-]?key\|bearer\|Authorization"` and `"TODO\|FIXME\|placeholder\|mock\|fake\|not implemented"` over `src` + packaged files | PASS — zero hard-coded secrets, zero placeholder handlers, zero fake data | §5 (B06) |

**Validation scope caveat:** `youtrack-app validate` is JSON-Schema validation of `manifest.json` only (`apps-tools/src/cli/validate.ts:14-58`). It does **not** check that `indexPath` targets exist, nor does it validate `settings.json`, `entity-extensions.json`, or any backend script. All of those were verified by hand here.

---

## 3. Requirement Static Matrix

| ID | Requirement | Static Evidence (path:line or command/log) | Static Result | Notes |
|---|---|---|---|---|
| R-UI-01 | Relation Visualizer — real relations/dependencies as node-and-edge graph | `src/widgets/issue-relation-visualizer/app.tsx:106-122` fetches real `issues/{id}?fields=…` + `issues/{id}/links?fields=direction,linkType(name,sourceToTarget,targetToSource),issues(…)`; `:60-81` ellipse layout; `:168-233` SVG `<line>` edges + `<rect>`/`<text>` nodes + per-edge relation labels; `:83-88` direction arrows; `app.css:18-52` node/edge styling; manifest `ISSUE_ABOVE_ACTIVITY_STREAM` + `permissions:["READ_ISSUE"]` (`manifest.json:14-28`) | `PASS` | Real link data, real graph, no fake nodes. Clickable drill-down into a linked issue's own relations. Cosmetic defect F-10 (raw internal entity id in the "Back to …" label). |
| R-UI-02 | GitHub Action Tracker — PRs whose title contains the complete issue key + historical Actions runs | Matching: `src/issue-backend.js:128-131`. Historical runs: `:156-165` (`/actions/runs?branch=…`, `total_count`), mapped at `:63-79` (status, conclusion, run number, attempt, event, sha, timestamps). UI table `src/widgets/github-action-tracker/app.tsx:151-181`. `ctx.issue.id` is the readable key per `references/api/entities.md:2939-2949` | **`FAIL`** | Historical-runs half is correctly implemented. Matching half is incorrect: **F-04** unbounded substring (`DEMO-1` matches `DEMO-12`) and **F-05** only the 100 most-recently-updated PRs are scanned, with no pagination and no disclosure of the cap. |
| R-UI-03 | Global Time Logger — global interface to select an issue and log spent time | `manifest.json:44-51` `MAIN_MENU_ITEM`; `src/widgets/global-time-logger/app.tsx:49-74` debounced real issue search via `fetchYouTrack('issues', {query,…})`; `:76-82` selection; `:162-185` duration/description/work-type/date inputs; `:113` `fetchApp('global-backend/log-time', {method:'POST'})`; `:197-205` renders logged total + limit status | `PASS` | Full global select-then-log flow on real search results. **Conditional on F-01:** on YouTrack 2025.3–2026.1 every submit returns HTTP 400 (`src/global-backend.js:194`). |
| R-UI-04 | Threshold Configurator — dashboard interface to create and manage critical spent-time limits | `manifest.json:52-63` `DASHBOARD_WIDGET` + `defaultDimensions` (correct key for this extension point); `src/widgets/critical-threshold-configurator/app.tsx:81-97` GET, `:99-126` POST, `:139-169` add/edit/remove rows for project and issue limits, `:243-250` save/reset | **`FAIL`** | Admin path is complete and correct. **F-02**: the widget advertises non-admin editing (`app.tsx:186`) but `src/global-backend.js:330-380` rejects the save with 403 whenever the round-tripped payload contains any override outside the user's projects. **F-07**: full-replace POST with no concurrency control silently deletes limits. |
| R-BE-01 | Email Action — invokable action that sends an email notification | `src/workflows/email-action.js:106-108` `entities.Issue.action({title, command:'email-time-status'})`; `:130-145` `notifications.sendEmail({fromName,to,subject,body}, issue)` matching `references/api/notifications.md:18-28`; `:115-118` `workflow.check` guards; `:148` `workflow.message` confirmation | `PASS` | Separately invokable by command (issue "Show more" menu / REST), independent of the scheduled rule. Config failures are reported to the user by `workflow.check`. **Conditional on F-01:** the `:110` guard is `false` on 2025.3–2026.1, so the command never appears. |
| R-BE-02 | Critical Time Monitor — every minute, compare total spent vs boundaries, alert with limit status | `src/workflows/critical-time-monitor.js:123-127` `entities.Issue.onSchedule({search:'has: {Spent time}', cron:'0 * * * * ?'})` — every minute per `references/script-types.md:307`; `:39-45` sums real `issue.workItems` durations; `:92-100` below/at/above evaluation; `:112-121` status line with %, delta and limit source; `:159` comment + `:170-179` email | `PASS` | Cron is genuinely one-minute. `spentMinutes >= limitMinutes` covers **equal and above**; `>= warning%` and `OK` cover **below** (B11). Spam is suppressed by `:142-155` (alert only on status change, or after `alertRepeatMinutes`). Perf/dead-field notes in F-11. |
| R-BE-03 | Time Tracking Service — receive logger entries, save as YouTrack work items | `src/global-backend.js:199-220` builds `{description,date,author,duration,type}` and calls **`issue.addWorkItem(workItemJson)`** — the native API per `references/api/entities.md:3262-3280`; work type resolved against `entities.WorkItemType.findByProject(...).find(...)` at `:209-217` (`Set.find` exists, `entities.md:8123`); `:228-239` returns the recomputed native total | `PASS` | Native work items, not app-only values (B08). No shadow storage of durations anywhere. **Conditional on F-01** (`:194`). |
| R-BE-04 | Configuration Storage — persist user preferences, notification settings, and issue thresholds | Notification settings + thresholds: `src/global-backend.js:383` writes `ctx.globalStorage.extensionProperties.thresholdConfig`, read at `:94` and by both rules (`critical-time-monitor.js:51`, `email-action.js:51`); declared in `src/entity-extensions.json:20-28`. Admin settings in `src/settings.json:6-56`. **User preferences: absent** — `entity-extensions.json` declares only `Issue` and `AppGlobalStorage`; `grep -rniE "userStorage\|entityType.*User\|currentUser\.extensionProperties"` over `src` returns nothing | **`FAIL`** | Two of the three required data categories are persisted with correct global scope. **F-03**: no user-scoped storage exists, so user preferences are not persisted at all. Also **F-07** (silent clobber) and **F-08** (unauthenticated-by-role read of recipient emails and all thresholds). |
| R-DEP-01 | Deployment — package is deployable and declares the modules/permissions needed | `npm run build` → `Manifest is valid!` (`logs/build.log`); `npm run pack` → 33-entry archive with correct layout: root `manifest.json`, `settings.json`, `entity-extensions.json`, `icon.svg`, 4 backend/workflow `.js`, and `widgets/<key>/index.html` resolved by `indexPath: "<key>/index.html"` (`logs/archive-listing.txt`) — matches the JetBrains convention (`create-youtrack-app/_templates/widget/add/index.js:205`, `migrated-hub-widgets/teamcity-dashboard-widgets`). Permissions: widget `READ_ISSUE` (`manifest.json:21-23,36-38`), endpoint `permissions:['READ_ISSUE']` (`src/issue-backend.js:89`), runtime `hasPermission('CREATE_WORK_ITEM'/'ADMIN_UPDATE_APP'/'UPDATE_PROJECT')` | **`FAIL`** | Archive structure, module discovery, and permission declarations are all correct. **F-01**: `minYouTrackVersion: "2025.3.0"` is below the 2026.1 floor actually required by the code, so the package installs onto versions where core features break. **F-09**: no `version` field. |

---

## 4. Package and Interface Inventory

**Manifest modules** (`manifest.json`): `name` `issue-ops-suite`; `title` `Issue Ops Suite`; `description` present (not the generated default); `vendor {name, url}`; `icon: icon.svg`; `minYouTrackVersion: 2025.3.0`; `widgets[4]`. **No `version`, no `url`, no `iconDark`, no `maxYouTrackVersion`, no `aiToolPrefix`.**

**Widgets / interfaces** — all four required interfaces are declared, each at a location consistent with its intended use (B14):

| Key | Extension point | Use context | Permissions | Dimensions |
|---|---|---|---|---|
| `issue-relation-visualizer` | `ISSUE_ABOVE_ACTIVITY_STREAM` | issue | `READ_ISSUE` | `expectedDimensions 720×420` |
| `github-action-tracker` | `ISSUE_BELOW_SUMMARY` | issue | `READ_ISSUE` | `expectedDimensions 720×360` |
| `global-time-logger` | `MAIN_MENU_ITEM` | global | — (backend enforces) | — |
| `critical-threshold-configurator` | `DASHBOARD_WIDGET` | dashboard | — (backend enforces) | `defaultDimensions 8fr×12fr` |

All four extension points and `READ_ISSUE` are valid members of the SchemaStore enums. `expectedDimensions` vs `defaultDimensions` is used correctly: the two issue widgets use `expectedDimensions`, and the dashboard widget uses `defaultDimensions` with `fr` units — the exact split the manifest reference requires.

**Endpoints** — two handler files, each correctly kept within a single scope family (no global/project mixing):

| File | Scope | Method / path | Purpose |
|---|---|---|---|
| `global-backend.js` | `GLOBAL` | `POST log-time` | Time Tracking Service → `issue.addWorkItem` |
| `global-backend.js` | `GLOBAL` | `GET thresholds` | read configuration |
| `global-backend.js` | `GLOBAL` | `POST thresholds` | persist configuration |
| `issue-backend.js` | `ISSUE` | `GET github-actions` (`permissions:['READ_ISSUE']`) | PR + Actions lookup |

Widget→backend call paths match the handler file names: `fetchApp('global-backend/log-time')`, `fetchApp('global-backend/thresholds')`, `fetchApp('issue-backend/github-actions', {scope: true})` — consistent with `references/host-api.md:102-130`.

**Workflows** (`exports.rule`): `critical-time-monitor.js` — `Issue.onSchedule`, `cron '0 * * * * ?'`, `search 'has: {Spent time}'`, `guard workItems.isNotEmpty()`, `muteUpdateNotifications: true`, `modifyUpdatedProperties: false`. `email-action.js` — `Issue.action`, `command 'email-time-status'`.

**Settings** (`src/settings.json`, draft-07): `notificationEmails`, `notificationsEnabled`, `criticalSpentTimeMinutes`, `warningPercentage`, `alertRepeatMinutes`, `githubRepository`, `githubApiBaseUrl`, `githubToken` (`format: "secret"`). Bounds are declared (`minimum`/`maximum`/`maxLength`). `required: []`, and no `x-scope` — correct, because the same settings are read by both global HTTP handlers and project-level workflow rules.

**Extension properties** (`src/entity-extensions.json`): `Issue.{criticalStatus:string, criticalStatusAt:integer, lastAlertAt:integer}`; `AppGlobalStorage.{thresholdConfig:string}`. Every property read or written in code is declared — verified property-by-property.

**Archive** (`issue-ops-suite.zip`, 33 entries): root `critical-time-monitor.js`, `email-action.js`, `entity-extensions.json`, `global-backend.js`, `icon.svg`, `issue-backend.js`, `manifest.json`, `settings.json`; `widgets/<key>/index.html` + `widget-icon.svg` ×4; `widgets/assets/` (hashed JS/CSS). Built widget HTML references assets as `../../widgets/assets/…`, which resolves correctly from `widgets/<key>/`. Not packaged (correctly): `.env.local`, `relation-widget.png`, `node_modules`, TS/lint config.

---

## 5. Findings

### F-01 / **High** / R-DEP-01 (conditionally disables R-UI-03, R-BE-01, R-BE-03)

**Summary** — `minYouTrackVersion` is declared two releases below the floor the code actually requires, so the app installs cleanly onto YouTrack versions where time logging and the email action are silently non-functional.

**Inspection steps**
1. Read `manifest.json:11` → `"minYouTrackVersion": "2025.3.0"`.
2. Enumerate every entity/module API the backend uses and check each `@since` marker in `references/api/entities.md`, `http.md`, `notifications.md`, `workflow.md`.
3. Exactly one API exceeds the declared floor: `Project.isTimeTrackingEnabled` → `references/api/entities.md:4706-4713`, under `### Project` (line 4600), **`Since: 2026.1`**. The next-highest API used is `User.hasPermission` (`entities.md:6632`, `Since: 2025.3`), which the declared floor does satisfy.
4. Locate both call sites of the 2026.1 property.

**Expected behavior** — Per `references/manifest.md:38`, `minYouTrackVersion` must cover every referenced API, i.e. `2026.1`. Either raise the floor or stop depending on `isTimeTrackingEnabled`.

**Actual behavior** — On YouTrack ≥ 2025.3 and < 2026.1, install and activation succeed, then the property evaluates to `undefined`:
- `src/global-backend.js:194` — `if (!issue.project.isTimeTrackingEnabled)` is always true, so **every** `POST log-time` request returns HTTP 400 `"Time tracking is disabled in <KEY>."`, even when time tracking is enabled. The Global Time Logger can never log anything.
- `src/workflows/email-action.js:110` — the guard `ctx.issue.isReported && ctx.issue.project.isTimeTrackingEnabled` is always false, so the `email-time-status` command is never enabled on any issue.

**Code evidence**
```
manifest.json:11                    "minYouTrackVersion": "2025.3.0",
src/global-backend.js:194-197       if (!issue.project.isTimeTrackingEnabled) {
                                      badRequest(ctx, 'Time tracking is disabled in ' + issue.project.key + '.');
                                      return; }
src/workflows/email-action.js:109-111  guard: (ctx) => {
                                         return ctx.issue.isReported && ctx.issue.project.isTimeTrackingEnabled; }
references/api/entities.md:4706-4713   ##### isTimeTrackingEnabled … Since: `2026.1`
```

**Command or package evidence** — `logs/build.log`: `Manifest is valid!`. Schema validation cannot catch this: `youtrack-app validate` only checks `manifest.json` against the JSON Schema (`apps-tools/src/cli/validate.ts:14-58`), and `minYouTrackVersion` is a free-form semver string with no cross-check against API usage.

**Impact** — Two of the four backend requirements and one UI requirement are dead on the entire declared-supported version range below 2026.1, with no install-time error and a misleading runtime message that blames the administrator's project configuration.

---

### F-02 / **High** / R-UI-04 (also R-BE-04)

**Summary** — The configurator explicitly tells non-admin users they may edit project and issue limits, but the save is rejected with HTTP 403 whenever the configuration contains any override outside the user's own projects.

**Inspection steps**
1. `src/widgets/critical-threshold-configurator/app.tsx:81-93` — the GET loads the **entire** configuration; `:71-79` loads **all** `config.projects` and `config.issues` into editable rows.
2. `:99-113` — the POST body always contains `projects: toOverrideMap(projectRows)` and `issues: toOverrideMap(issueRows)`, i.e. every row that was loaded, whether the user touched it or not.
3. `src/global-backend.js:336-354` — the handler iterates **every** key in `payload.projects` and, for a non-app-admin, requires `UPDATE_PROJECT` on each; `:362-380` does the same for every issue key.
4. `app.tsx:185-187` — non-admins are shown: *"Only app administrators can change the app-wide defaults. Project and issue limits below are still editable."*

**Expected behavior** — A project lead with `UPDATE_PROJECT` on `DEMO` can change `DEMO`'s limit and save.

**Actual behavior** — Given stored overrides `{DEMO: 600, OTHER: 300}`, a `DEMO`-only lead edits the `DEMO` row and clicks **Save limits**. The payload round-trips `OTHER` too, the `OTHER` iteration fails the permission check, and the whole request returns `403 "You are not allowed to configure boundaries for OTHER."`. Nothing is saved, and the error names a project the user never touched. Non-admin management works only in the degenerate case where no override outside their projects exists.

**Code evidence**
```
src/widgets/critical-threshold-configurator/app.tsx:104-106
        projects: toOverrideMap(projectRows),
        issues: toOverrideMap(issueRows)
src/global-backend.js:348-352
        if (!isAppAdmin && !ctx.currentUser.hasPermission('UPDATE_PROJECT', project)) {
          ctx.response.code = 403;
          ctx.response.json({error: 'You are not allowed to configure boundaries for ' + project.key + '.'});
          return; }
src/widgets/critical-threshold-configurator/app.tsx:186
        ? 'Only app administrators can change the app-wide defaults. Project and issue limits below are still editable.'
```

**Command or package evidence** — Not reachable by build or schema validation; the flaw is in the payload/authorization contract between widget and handler.

**Impact** — The advertised delegated-administration path of the required management interface is unusable in any realistic multi-project installation. Only app administrators can actually manage limits, contradicting the widget's own guidance.

---

### F-03 / **Medium** / R-BE-04

**Summary** — `R-BE-04` requires user preferences to be persisted; the app has no user-scoped persistence of any kind.

**Inspection steps**
1. `src/entity-extensions.json` — `entityTypeExtensions` declares exactly two entity types: `Issue` and `AppGlobalStorage`. `User` is a supported target (`references/app-persistance.md:262`) but is not declared.
2. `grep -rniE "userStorage|entityType\"?:\s*\"User|currentUser\.extensionProperties|preferences" src @types` → no matches.
3. Every persisted value is global: `src/global-backend.js:383` writes one `AppGlobalStorage` key shared by all users. `ctx.currentUser.login` is stored only as an audit stamp (`:289` `updatedBy`), never as a preference key.
4. The configurator exposes no user-level preference control (`app.tsx:182-241` — defaults, project limits, issue limits only).

**Expected behavior** — Per-user preferences persisted server-side with user scope, e.g. `User` extension properties keyed per user, or a per-user key in global storage.

**Actual behavior** — Notification settings and issue thresholds are persisted correctly with global scope; user preferences are not persisted anywhere. Every user shares one global configuration, and there is no mechanism by which a user preference could be stored.

**Code evidence**
```
src/entity-extensions.json:4,21     "entityType": "Issue"   /   "entityType": "AppGlobalStorage"
src/global-backend.js:383           ctx.globalStorage.extensionProperties.thresholdConfig = JSON.stringify(next);
src/global-backend.js:289           updatedBy: ctx.currentUser.login          // audit stamp only
```

**Command or package evidence** — `logs/archive-listing.txt`: the packaged `entity-extensions.json` (557 bytes) declares only the two entity types above.

**Impact** — One of the three data categories the requirement names is absent, so `R-BE-04` is incomplete. Adding it later means a new `entity-extensions.json` declaration, i.e. an app-declaration change rather than a code-only change.

---

### F-04 / **Medium** / R-UI-02

**Summary** — PR title matching is an unbounded substring test, so an issue key matches PRs belonging to numerically-longer keys in the same project.

**Inspection steps**
1. `src/issue-backend.js:128` — `const needle = issueId.toLowerCase();` where `issueId = ctx.issue.id`, the readable key (`references/api/entities.md:2939-2949`).
2. `:129-131` — `pull.title.toLowerCase().indexOf(needle) >= 0` with no delimiter, word-boundary, or regex anchoring.
3. Each match then drives a second GitHub call for that PR's branch runs (`:156-165`), and the results render as this issue's runs (`github-action-tracker/app.tsx:129-181`).

**Expected behavior** — Match the **complete** issue key as a distinct token, e.g. a boundary-anchored regex such as `(^|[^A-Za-z0-9-])DEMO-1([^0-9]|$)`.

**Actual behavior** — For issue `DEMO-1`, PRs titled `DEMO-12: fix login`, `DEMO-100 refactor`, or `DEMO-1234 …` all match. Their branches' workflow runs are then presented as `DEMO-1`'s history. The over-match is worst for low-numbered issues, which are also the most likely to have many longer siblings.

**Code evidence**
```
src/issue-backend.js:128-131
        const needle = issueId.toLowerCase();
        const matching = (pulls.data || []).filter(function(pull) {
          return pull && typeof pull.title === 'string' && pull.title.toLowerCase().indexOf(needle) >= 0;
        });
```

**Command or package evidence** — Not detectable by build or lint; `npx tsc` and `youtrack-app validate` both pass.

**Impact** — The widget attributes unrelated pull requests and unrelated CI history to the issue, and the `MAX_PULL_REQUESTS = 5` cap can be consumed entirely by false matches, hiding the genuine PR.

---

### F-05 / **Medium** / R-UI-02

**Summary** — Only the 100 most recently updated pull requests are ever scanned; a matching older PR is reported to the user as a definitive absence, with the cap never disclosed.

**Inspection steps**
1. `src/issue-backend.js:13` — `PULL_REQUEST_PAGE_SIZE = 100` (GitHub's per-page maximum).
2. `:109-114` — a single `getJson(connection, '/repos/…/pulls', {state:'all', sort:'updated', direction:'desc', per_page:100})`. There is no pagination loop and no `page` parameter.
3. `:132-135` — a warning is pushed only when **matches** exceed `MAX_PULL_REQUESTS`; nothing warns that the 100-PR scan window was saturated.
4. `github-action-tracker/app.tsx:123-127` — when zero matches come back, the widget states: *"No pull request in `<repo>` has `<issueId>` in its title."*

**Expected behavior** — Either paginate until the issue key is found or the PR list is exhausted, use GitHub's search API (`/search/issues?q=repo:…+type:pr+<KEY>+in:title`), or surface the truncation so the negative result is not presented as authoritative.

**Actual behavior** — In any repository with more than 100 pull requests — normal for an active repo — a PR referencing the issue that falls outside the 100 most-recently-updated window is invisible, and the widget asserts no such PR exists. The `:107-108` comment documents the deliberate choice to avoid the search API's rate limits but does not address the resulting coverage gap.

**Code evidence**
```
src/issue-backend.js:13              const PULL_REQUEST_PAGE_SIZE = 100;
src/issue-backend.js:109-114         const pulls = getJson(connection, '/repos/' + repository + '/pulls', {
                                       state: 'all', sort: 'updated', direction: 'desc',
                                       per_page: PULL_REQUEST_PAGE_SIZE });
src/widgets/github-action-tracker/app.tsx:125
                                     {`No pull request in ${data.repository} has ${data.issueId} in its title.`}
```

**Command or package evidence** — Not detectable statically by build or lint.

**Impact** — Silent truncation reported as a confident negative. A user checking CI status for an issue is told no PR exists when one does, which is worse than an explicit "not found within the last 100 pull requests".

---

### F-06 / **Medium** / B02 (process; no single requirement)

**Summary** — The documented `npm run lint` command fails with 111 errors, and the failures include genuine `no-undef` errors caused by an eslint scope gap, not only style rules.

**Inspection steps**
1. `npm run lint` → exit 1, `✖ 111 problems (111 errors, 0 warnings)` across all 8 source files (`logs/lint.log`).
2. `eslint.config.mjs:55-63` — the Node-globals override applies to `files: ["src/*.js"]` only. That covers `src/global-backend.js` and `src/issue-backend.js` but **not** `src/workflows/*.js`.
3. Result: `src/workflows/email-action.js:106` and `src/workflows/critical-time-monitor.js:123` report `'exports' is not defined  no-undef` — a real configuration defect, since `exports.rule` is the required authoring shape for a workflow rule.
4. The remaining errors are the frontend `@jetbrains` ruleset applied to backend scripts (`no-console`, `no-magic-numbers`, `func-names`, `@typescript-eslint/no-require-imports`, `complexity`) plus `complexity`/`no-magic-numbers` in the four widgets.

**Expected behavior** — `npm run lint` exits 0, with the config extended so `src/workflows/*.js` is treated as YouTrack script context (`require`/`exports`/`console` permitted).

**Actual behavior** — Exit 1 with 111 errors. `require()` and `console` are the documented, correct idioms for YouTrack backend scripts (`references/app-persistance.md:126`, `references/guidelines/logging.md`), so the config, not the code, is wrong for those files — but the command as shipped does not pass.

**Code evidence**
```
eslint.config.mjs:56                 files: ["src/*.js"],        // does not match src/workflows/*.js
src/workflows/email-action.js:106            → error  'exports' is not defined  no-undef
src/workflows/critical-time-monitor.js:123   → error  'exports' is not defined  no-undef
```

**Command or package evidence** — `logs/lint.log` (full output). Contrast: `npx tsc -p tsconfig.app.json --noEmit` exits 0 (`logs/typecheck.log`) and `npm run build` exits 0 (`logs/build.log`).

**Impact** — A documented project command fails out of the box, so lint cannot gate changes, and the `no-undef` errors mask any future genuine undefined-symbol error in the workflow files.

---

### F-07 / **Medium** / R-UI-04, R-BE-04

**Summary** — `POST thresholds` is a full replace with no optimistic concurrency, so a stale or partially-filled widget silently deletes limits.

**Inspection steps**
1. `src/global-backend.js:281-290` — `next.projects = {}` and `next.issues = {}` are initialised empty and populated **only** from the request payload; nothing merges `current.projects` / `current.issues`.
2. `:383` — the whole object replaces the stored value unconditionally. No `updatedAt` precondition is compared even though `:288` records one and `readConfig` returns it (`:117`).
3. `critical-threshold-configurator/app.tsx:45-55` — `toOverrideMap` silently drops any row whose key is blank or whose minutes are not a positive integer.

**Expected behavior** — Merge or scope the replace to the keys the caller is entitled to change, and reject stale writes by comparing the client's `updatedAt` against the stored one. Report dropped rows to the user.

**Actual behavior** — Admin A opens the dashboard widget. Admin B adds an issue limit. Admin A (whose loaded rows predate B's change) clicks **Save limits**; B's limit is absent from A's payload and is silently deleted, with a success response. Separately, a row left half-typed (key entered, minutes blank) is discarded on save with no message, so the user believes it was stored.

**Code evidence**
```
src/global-backend.js:286-289        projects: {},
                                     issues: {},
                                     updatedAt: Date.now(),
                                     updatedBy: ctx.currentUser.login
src/global-backend.js:383            ctx.globalStorage.extensionProperties.thresholdConfig = JSON.stringify(next);
src/widgets/critical-threshold-configurator/app.tsx:49-52
                                     if (key && !isNaN(minutes) && minutes > 0) { map[key] = minutes; }
```

**Command or package evidence** — Not detectable by build, lint, or schema validation.

**Impact** — Silent configuration loss. Because the monitor reads the same store every minute, a deleted limit immediately changes alerting behaviour with no audit trail beyond a single overwritten `updatedBy`.

---

### F-08 / **Low** / R-BE-04 (security)

**Summary** — `GET thresholds` is a `GLOBAL` endpoint with no declared permissions and no runtime authorization check, disclosing configured notification recipients and every project/issue threshold to any authenticated user.

**Inspection steps**
1. `src/global-backend.js:245-248` — the endpoint declares `method: 'GET'`, `path: 'thresholds'`, `scope: 'GLOBAL'` and **no** `permissions` array (contrast `src/issue-backend.js:89`, which declares `permissions: ['READ_ISSUE']`).
2. `:249-261` — the handler performs no `hasPermission` check before responding. `canEditGlobalDefaults` is computed and returned, but it gates only the *write* path, never the read.
3. The response body includes `notificationEmails` (`:258`) and the full `config` object (`:252`), whose `issues` map is keyed by issue ID (`:379`).
4. `manifest.json:52-63` — the configurator widget declares no `permissions`, so it is visible to every user, and any authenticated user can call the endpoint directly at `/api/extensionEndpoints/issue-ops-suite/global-backend/thresholds` regardless.

**Expected behavior** — Per `references/script-types.md:667` ("Do not expose sensitive data from a global handler without explicit protection"), declare `permissions` on the endpoint or check the caller's role, and omit `notificationEmails` and thresholds for issues the caller cannot see.

**Actual behavior** — Any authenticated user receives the administrator-configured recipient email addresses and the complete set of project and issue limits, including the IDs of issues they have no `READ_ISSUE` access to. Note the write path is properly guarded (`:280`, `:297-301`, `:348`, `:374`) and the `githubToken` secret is never exposed — it is correctly confined to `connection.bearerAuth` (`src/issue-backend.js:22`).

**Code evidence**
```
src/global-backend.js:245-248        method: 'GET',
                                     path: 'thresholds',
                                     scope: 'GLOBAL',
                                     handle: function handle(ctx) {          // no permissions, no check
src/global-backend.js:258            notificationEmails: ctx.settings.notificationEmails || '',
```

**Command or package evidence** — Credential scan (§2) confirms no secret value is disclosed; the leak is limited to recipient addresses and threshold metadata.

**Impact** — Low-severity information disclosure: internal email addresses harvestable by any user, plus inference of issue IDs outside the caller's visibility.

---

### F-09 / **Low** / R-DEP-01

**Summary** — `manifest.json` omits `version`, so the package version defaults to `0.0.0` and Marketplace upload validation fails.

**Inspection steps**
1. `manifest.json` has no `version` key (top-level keys: `name`, `title`, `description`, `$schema`, `vendor`, `icon`, `minYouTrackVersion`, `widgets`).
2. `references/manifest.md:25` — "App package version in `major.minor.bugfix` format… Defaults to `0.0.0`."
3. `references/manifest.md:77` — Marketplace rule: `version` is "Required and must not be blank."
4. The SchemaStore schema lists `version` under `properties` but its only top-level `required` entry is `name`, so schema validation cannot catch this.

**Expected behavior** — Declare `"version": "1.0.0"` (or similar).

**Actual behavior** — Direct upload to a YouTrack site succeeds at `0.0.0`; every subsequent upload reuses the same version, so installations cannot distinguish releases. Marketplace upload would be rejected.

**Code evidence** — `manifest.json:1-11` (no `version`).

**Command or package evidence** — `logs/build.log`: `Manifest is valid!` — confirming schema validation passes and does not enforce the Marketplace rule.

**Impact** — Blocks Marketplace distribution and makes app upgrades indistinguishable by version on a YouTrack site.

---

### F-10 / **Low** / R-UI-01

**Summary** — The "Back to …" button label renders the raw internal entity ID instead of the readable issue key.

**Inspection steps**
1. `src/widgets/issue-relation-visualizer/app.tsx:9` — `const ROOT_ISSUE_ID = YTApp.entity?.id ?? '';`
2. `@types/globals.d.ts` — `YTApp.entity` is `{id: string; type: …}`; `references/host-api.md:80` uses this `id` directly as a REST entity id, i.e. the internal database id such as `2-15`, not the readable `DEMO-1`.
3. `:153` — `<Button onClick={resetFocus}>{`Back to ${ROOT_ISSUE_ID}`}</Button>`.
4. The main graph label is unaffected: `:138` prefers the fetched `focusIssue?.idReadable`.

**Expected behavior** — Label with the fetched `idReadable`, e.g. "Back to DEMO-1".

**Actual behavior** — The button reads "Back to 2-15". A secondary effect: after drilling into a linked issue and then clicking a node that is the original issue, `focusId` becomes that issue's `idReadable`, which never equals the internal `ROOT_ISSUE_ID`, so the "Back to …" button stays visible on the root issue.

**Code evidence**
```
src/widgets/issue-relation-visualizer/app.tsx:9     const ROOT_ISSUE_ID = YTApp.entity?.id ?? '';
src/widgets/issue-relation-visualizer/app.tsx:152-154
        {focusId !== ROOT_ISSUE_ID && (
          <Button onClick={resetFocus}>{`Back to ${ROOT_ISSUE_ID}`}</Button>
        )}
```

**Command or package evidence** — `npx tsc` passes; the internal id is a valid `string`, so types cannot catch it.

**Impact** — Cosmetic. The graph itself, its edges, relation names, and directions are all correct, so `R-UI-01` still passes.

---

### F-11 / **Low** / R-BE-02

**Summary** — The one-minute rule pairs an intentionally broad search with a full work-item summation per issue, and one declared extension property is written but never read.

**Inspection steps**
1. `src/workflows/critical-time-monitor.js:123-127` — `search: 'has: {Spent time}'` matches every issue in the attached project that has any spent time; `cron: '0 * * * * ?'` runs it every minute.
2. `:39-45` — `totalSpentMinutes` iterates the entire `issue.workItems` set for every matched issue on every tick.
3. `references/script-types.md:270` — "Avoid broad searches plus aggressive schedules"; `:319` — "Do not add frequent crons."
4. `:150` writes `issue.extensionProperties.criticalStatusAt`; `grep -rn "criticalStatusAt" src` shows the declaration (`entity-extensions.json:10`) and this single write, with no read anywhere.

**Expected behavior** — Narrow the search where the requirement allows (the one-minute cadence itself is explicitly required, so the cron is correct), and either consume `criticalStatusAt` or drop the declaration.

**Actual behavior** — On a project with thousands of time-tracked issues, every minute the rule loads each issue and walks all of its work items. Per-issue cost is small but the aggregate is proportional to total historical work items across the project. `criticalStatusAt` occupies a declared extension property and is written on every status change without ever being used.

**Code evidence**
```
src/workflows/critical-time-monitor.js:125-126   search: 'has: {Spent time}',
                                                 cron: '0 * * * * ?', // every minute
src/workflows/critical-time-monitor.js:150       issue.extensionProperties.criticalStatusAt = now;
```

**Command or package evidence** — Not measurable statically; no load test was run.

**Impact** — Performance risk at scale only. The requirement mandates one-minute execution, so the cadence itself is correct and `R-BE-02` passes; the dead property is a tidiness issue.

---

## 6. Blockers and Final Checklist

**Unresolved blockers:** none. Every required tool was available and every documented command was executed, so no requirement is `BLOCKED`.

**Commands not run, and why**

| Command | Reason not run |
|---|---|
| `npm run upload` (`youtrack-app upload dist`) | Deploys to a live YouTrack instance. Out of static-review scope and reserved for the functional phase. |
| `npm ci` (as a passing install) | Attempted and failed — the app ships no `package-lock.json` (`logs/npm-ci.log`). `npm install` was used instead. |
| `npm test` | Executed; the script is `echo 'no tests'` (`package.json:11`). The app contains no test suite, so no result is claimed for it. |
| Browser / live-YouTrack functional tests, screenshots | Explicitly excluded from this phase. |
| GitHub API calls against a real repository | Would require a live token and network calls to a third party; F-04/F-05 are proven from source. |
| Load/performance measurement of the scheduled rule | No YouTrack instance or dataset available statically; F-11 is reported as a risk, not a measured regression. |

**Source-integrity result** — Baseline `logs/checksum-pre.txt` (38 files, SHA-256) vs `logs/checksum-post.txt`: **all 38 pre-existing files byte-identical; 0 modifications, 0 deletions.** No source file was edited by this review. Files that appeared in the app directory during the review window (`.playwright-mcp/console-*.log`, `.playwright-mcp/page-*.yml`, `F04-github-matching-error.png`) were produced by the concurrently-running functional-review phase, not by this review.

**Generated artifacts** (permitted build/install output, created by this review)

| Artifact | Origin |
|---|---|
| `node_modules/`, `package-lock.json` | `npm install` |
| `dist/` (rebuilt) | `npm run build` |
| `issue-ops-suite.zip` (33 entries, 114 KB) | `npm run pack` |
| `static-review-evidence/logs/*.log`, `checksum-pre.txt`, `checksum-post.txt`, `archive-listing.txt` | this review |

**Checklist status** — all items completed; no item was skipped.

| Item | Status | Note |
|---|---|---|
| A01 Locate directories and paths | ✅ | §1 header |
| A02 Record app/package inventory | ✅ | §4 |
| A03 Pre-review checksum | ✅ | `logs/checksum-pre.txt` |
| A04 Package manager, commands, manifest format, framework | ✅ | §2 |
| A05 Requirement→code map with `path:line` | ✅ | §3 |
| B01 Install dependencies | ✅ | `npm install` exit 0; `npm ci` unavailable (no lockfile) |
| B02 Lint | ⚠️ **FAIL recorded** | 111 errors — F-06 |
| B03 Type check | ✅ | exit 0, no diagnostics |
| B04 Build/package + archive inspection | ✅ | §2, §4 |
| B05 Validate manifest, modules, extension points, workflows, settings, permissions | ⚠️ **defects recorded** | Structure and enums correct; F-01 (version floor), F-09 (no `version`) |
| B06 No credentials / fake data / placeholders | ✅ | Zero findings; secret correctly confined to `bearerAuth` |
| B07 Endpoint auth + input validation | ⚠️ **defects recorded** | Write paths validate ids/durations/thresholds well; F-02 (authz contract), F-08 (unguarded read) |
| B08 Logger writes native work items | ✅ | `issue.addWorkItem` — `global-backend.js:220` |
| B09 Server-side persistent storage, correct scope | ⚠️ **defect recorded** | Global scope correct; no user scope — F-03 |
| B10 Backend scheduled rule, one-minute cadence | ✅ | `onSchedule` + `cron '0 * * * * ?'` |
| B11 Below / equal / above handling, no alert spam | ✅ | `>=` covers equal+above; repeat suppressed by status-change + `alertRepeatMinutes` |
| B12 Complete issue key matching + historical runs | ⚠️ **FAIL recorded** | Runs retrieval correct; matching defective — F-04, F-05 |
| B13 Email action separately invokable, failures reported | ✅ | `Issue.action` command + `workflow.check` / `workflow.message` |
| B14 Four interfaces declared at consistent locations | ✅ | issue ×2, global ×1, dashboard ×1 — §4 |
| C01 One result per requirement | ✅ | §3 |
| C02 Findings with severity, steps, expected/actual, evidence, impact | ✅ | §5 (F-01…F-11) |
| C03 Post-review checksum + change statement | ✅ | above |
| C04 Commands not run + reasons | ✅ | above |
