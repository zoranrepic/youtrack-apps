# Functional Review Report — Issue Ops Suite (generated YouTrack app)

- Reviewer role: independent functional reviewer (live behaviour only; no static/build review, no source edits)
- YouTrack instance: `https://exploration.youtrack.cloud`
- Project under test: `DEMO` (Demo project, id `184-5413`)
- App: `issue-ops-suite` ("Issue Ops Suite"), installed version reported by YouTrack: `0.0.1`
- Review window: 2026-07-28 21:35Z – 22:20Z
- Browser automation: Playwright MCP (Chromium, logged in as `admin`)
- Report path: `system-test/runs/20260728T211622Z/functional-review-report.md`
- Evidence: `functional-review-evidence/screenshots/` (21 screenshots), `functional-review-evidence/logs/` (12 logs)

---

## 1. Executive Summary

**Functional verdict: FAIL.**

Seven of the nine source-of-truth requirements behave correctly on the live instance. Two fail:

- **R-UI-04 Threshold Configurator — FAIL (blocking).** The dashboard widget never leaves its loading state. The browser console throws `TypeError: Cannot read properties of undefined (reading 'scope')` inside `host.fetchApp`, and **zero** network requests reach the thresholds endpoint. There is therefore no working interface to create or manage critical spent-time limits, which is the requirement itself. The storage layer behind it works, so the defect is confined to the widget call.
- **R-UI-02 GitHub Action Tracker — FAIL.** Pull-request titles are matched by plain substring, so an issue key that is a prefix of another key matches the wrong pull request. Live proof: issue **DEMO-4** displays PR #1 titled `YTAPP-REVIEW-20260728T2148Z DEMO-41 functional review pull request` and that PR's Actions runs. The requirement asks for PRs whose title contains the **complete** issue key.

Working as required: the relation graph (real links, real relation names, empty state), the global time logger (search, select, validate, log), conversion of logger entries into **native YouTrack work items**, the invokable email action (success and a clean error path), the per-minute Critical Time Monitor (alerts observed in two consecutive minute executions, correct limit status, correct below-limit silence, no alert spam), and configuration storage (values written through the app endpoint are read back by a *separate* workflow runtime).

A third, non-blocking defect: widget error banners show only `Error: 502` / `Error: 400` while the backends return actionable, secret-free messages that the user never sees.

Deployment is sound: installed, globally enabled, attached and active on `DEMO`, and the installed manifest/scripts are byte-identical to the local `dist/` build.

Source integrity: the 28 tracked source files (`src/**`, `manifest.json`, `package.json`) are **unchanged** — pre- and post-review sha256 dumps are identical.

---

## 2. Environment and Deployment Results

| Check | Steps or Command | Result | Evidence/log |
| --- | --- | --- | --- |
| A01 YouTrack instance reachable and authenticated | Playwright navigation to `https://exploration.youtrack.cloud` as `admin`; REST probe `GET /api/users/me` with the harness token | PASS | `screenshots/D01-installed-app.png` |
| A02 App installed and enabled | Administration → Apps → Issue Ops Suite; `youtrack-app list` | PASS — installed, globally enabled | `screenshots/D01-installed-app.png` |
| A03 App identity confirmed from the live instance | App details page (name, version); `youtrack-app info issue-ops-suite` | PASS — `issue-ops-suite`, version `0.0.1` (local `package.json` says `0.0.0`; `manifest.json` carries no `version` field, so YouTrack's number is the authoritative one) | `screenshots/D02-app-identity.png`, `logs/d02-installed-vs-local.txt` |
| A04 Installed code matches the local build | `youtrack-app scripts issue-ops-suite <script-id>` for each script + manifest, compared to `dist/` | PASS — manifest sha `93c991f4…` matches; all four scripts identical except a CLI-added trailing newline | `logs/d02-installed-vs-local.txt` |
| A05 Source baseline recorded before testing | `find src manifest.json package.json -type f | xargs shasum -a 256` | PASS — 28 files baselined | `logs/pre-review-checksums.txt` |
| D01 App attached to the project under test | `youtrack-app project-apps DEMO` / `usages` | PASS — attached and active on `DEMO` (`184-5413`) | `screenshots/D01-installed-app.png` |
| D02 Declared surfaces exist on the live instance | Compared the four manifest widgets to what YouTrack renders | PASS — all four are registered; `ISSUE_ABOVE_ACTIVITY_STREAM`, `ISSUE_BELOW_SUMMARY`, `MAIN_MENU_ITEM`, `DASHBOARD_WIDGET` | `screenshots/D03-widget-locations-mainmenu.png` |
| D03 App is usable end to end after deployment | Opened every surface and exercised it (F01–F18) | PARTIAL — 3 of 4 widgets usable; the Critical Threshold Configurator is unusable (FF-01) | `screenshots/F08-threshold-widget-broken.png` |
| E05 Source baseline re-verified after testing | Re-ran the checksum dump and diffed it against the baseline | PASS — 28/28 hashes identical, no source file touched | `logs/post-review-checksums.txt`, `logs/checksum-diff.txt` |

Test data created for the review (all prefixed `YTAPP-REVIEW-20260728T2148Z-`):

| Artifact | Purpose |
| --- | --- |
| `DEMO-41` … `DEMO-47` (7 issues) | logger, relation graph, GitHub tracker and monitor-boundary tests |
| Link topology on `DEMO-46` (relates to / depends on / subtask of) | R-UI-01 graph with several relation types |
| GitHub repo `zoranrepic/ytapp-review-20260728t2148z` (private) with PR #1 and 6 successful "YTAPP Review CI" runs | R-UI-02 matching and Actions history |
| Dashboard `170-4` with the two global widgets | R-UI-03 / R-UI-04 hosting |
| Threshold overrides `DEMO-40/42/43/44/45/46/47` and a `DEMO` project limit | monitor boundary cases |

---

## 3. Requirement Functional Matrix

| ID | Requirement | Live Test IDs | Screenshot(s) | Functional Result | Notes |
| --- | --- | --- | --- | --- | --- |
| R-UI-01 | Relation Visualizer — node/edge graph of the issue's real relations | F01, F02 | `F01-relation-graph.png`, `F02-relation-empty.png` | PASS | Real links only; relation names and direction arrows come from `linkType`; nodes are clickable to re-focus; correct empty state. |
| R-UI-02 | GitHub Action Tracker — PRs whose title contains the complete issue key, plus historical Actions runs | F03, F04 | `F03-github-history.png`, `F04-github-false-positive.png`, `F04-github-matching-error.png` | **FAIL** | Actions history is correct (F03), but title matching is a substring test, so `DEMO-4` matches a `DEMO-41` PR (FF-01/FF-02). Error surfacing is opaque (FF-03). |
| R-UI-03 | Global Time Logger — pick any issue globally and log spent time | F05, F06, F07 | `F05-global-logger.png`, `F06-logger-success.png`, `F07-invalid-time.png` | PASS | Global issue search/selection works, valid durations are accepted with a status summary, invalid durations are rejected. |
| R-UI-04 | Threshold Configurator — dashboard interface to create and manage critical spent-time limits | F08, F09, F10 | `F08-threshold-widget-broken.png` | **FAIL** | Widget never loads (infinite spinner, client-side `TypeError`, no request issued). No limit can be created, edited or deleted through any UI (FF-01). |
| R-BE-01 | Email Action — invokable action that sends an email | F11, F12 | `F11-email-command-preview.png`, `F11-email-delivered.png`, `F12-email-error.png` | PASS | `email-time-status` is offered in the command dialog, sends the report and confirms in the UI; the disabled-notifications path fails cleanly with an actionable, secret-free message. |
| R-BE-02 | Critical Time Monitor — runs every minute, compares spent time to the boundaries, alerts with the limit status | F13, F14, F15, F16, F17 | `F13-minute-executions-a.png`, `F13-minute-executions-b.png`, `F14-below-limit.png`, `F15-at-limit.png` | PASS | Alerts observed at 22:11:00Z and 22:12:00Z (consecutive minute executions); at-limit is CRITICAL; below-limit is silent; no repeat alerts. Alert text (below the screenshot fold) is captured verbatim in `logs/f13-f17-monitor-alerts.txt` — see Blockers note B-2. |
| R-BE-03 | Time Tracking Service — logger entries become native YouTrack work items | F06, F18 | `F06-work-item-saved.png`, `F18-end-to-end-logged.png` | PASS | Entries appear in the issue's native Spent time tab with correct author, date, duration and description, and roll up into the `Spent time` field. |
| R-BE-04 | Configuration Storage — persists preferences, notification settings and thresholds | F09, F10 | `F13-minute-executions-a.png`, `F15-at-limit.png` | PASS | Values written via the app endpoint survive reloads and new sessions and are read back by the *separate* scheduled-workflow runtime (`Limit source: issue` alerts use the stored numbers). Evidence: `logs/f09-f10-threshold-persistence.txt`. The storage layer is sound; only its UI (R-UI-04) is broken. |
| R-DEP-01 | Deployment — installed, enabled and usable | A02, D01, D02, D03 | `D01-installed-app.png`, `D02-app-identity.png`, `D03-widget-locations-mainmenu.png` | PASS | Installed, globally enabled, attached and active on `DEMO`, installed code identical to the local build. Usability caveat recorded under R-UI-04, not against deployment itself. |

Failing requirements: **R-UI-02, R-UI-04** → functional verdict **FAIL**.

---

## 4. Functional Test Results

### F01 — Relation graph renders real relations
- **Test ID:** F01
- **Preconditions/data:** `DEMO-46` (`YTAPP-REVIEW-20260728T2148Z-Graph`) linked to three other review issues with *relates to*, *depends on* and *subtask of*.
- **Steps:** Open `https://exploration.youtrack.cloud/issue/DEMO-46` → expand the Issue Relation Visualizer panel.
- **Expected:** A node/edge graph with the focused issue at the centre, one node per linked issue, edges labelled with the real relation names and direction.
- **Actual:** Graph rendered with the focused issue in the centre and the linked issues on a ring; edge labels showed `→ depends on`, `← subtask of`, `↔ relates to`; header read "N linked issue(s) in M relation type(s)"; clicking a node re-focused the graph on that issue and a "Back to DEMO-46" button appeared.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F01-relation-graph.png`

### F02 — Relation graph empty state
- **Test ID:** F02
- **Preconditions/data:** `DEMO-47` (`…-NoRel`), no links.
- **Steps:** Open `issue/DEMO-47` → expand the visualizer.
- **Expected:** A clear empty state, no fabricated nodes, no error.
- **Actual:** "No links for this issue yet"; only the focused node drawn; no console error.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F02-relation-empty.png`

### F03 — GitHub Action Tracker shows historical Actions runs
- **Test ID:** F03
- **Preconditions/data:** App setting `githubRepository = zoranrepic/ytapp-review-20260728t2148z`; PR #1 titled `YTAPP-REVIEW-20260728T2148Z DEMO-41 functional review pull request` on branch `ytapp-review/demo-41`; 6 successful "YTAPP Review CI" runs.
- **Steps:** Open `issue/DEMO-41` → GitHub Action Tracker panel.
- **Expected:** The matching PR with its past Actions runs (workflow, run number, event, status, timestamps).
- **Actual:** PR #1 listed with state OPEN, branch, head sha `f8075c5`, author, and a table of 6 runs (#7.1 pull_request success, #6.1 push success, #5.1, #4.1, #3.1, #2.1) with timestamps. App log: `GitHub action tracker for,DEMO-41,- matched pull requests:,1`.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F03-github-history.png`

### F04 — GitHub Action Tracker key matching and error handling
- **Test ID:** F04
- **Preconditions/data:** Same repository. Second issue `DEMO-4` (a pre-existing issue whose key is a prefix of `DEMO-41`). No PR references `DEMO-4`.
- **Steps:** (a) Open `issue/DEMO-4` → GitHub Action Tracker. (b) Point `githubApiBaseUrl`/`githubRepository` at a non-existent repository and reload the panel on `DEMO-41`.
- **Expected:** (a) "No pull request … has DEMO-4 in its title" — only complete-key matches. (b) An actionable error message in the widget.
- **Actual:** (a) **DEMO-4 displayed PR #1 (`… DEMO-41 …`) and all 6 of its Actions runs** — a false positive; the backend log confirms `matched pull requests:,1` for `DEMO-4`. (b) The widget showed only `Error: 502`; the backend body contained the actionable text `GitHub responded with HTTP 404 for /repos/zoranrepic/ytapp-review-does-not-exist-20260728/pulls`, which never reaches the user.
- **Result:** **FAIL**
- **Screenshot(s):** `functional-review-evidence/screenshots/F04-github-false-positive.png`, `functional-review-evidence/screenshots/F04-github-matching-error.png`; body in `logs/f04-error-body.txt`

### F05 — Global Time Logger issue selection
- **Test ID:** F05
- **Preconditions/data:** Global widget opened from the main menu; dashboard `170-4`.
- **Steps:** Open the Global Time Logger → type `YTAPP-REVIEW` in the issue field → select `DEMO-41` from the results.
- **Expected:** Global search across projects, selectable result, no requirement to be on an issue page.
- **Actual:** Search returned the review issues from outside any issue context; `DEMO-41` was selectable and its summary and current spent time were shown.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F05-global-logger.png`

### F06 — Log spent time and verify the native work item
- **Test ID:** F06
- **Preconditions/data:** `DEMO-41`, time tracking enabled on `DEMO`, user has CREATE_WORK_ITEM.
- **Steps:** In the logger, select `DEMO-41`, duration `1h 15m`, description `YTAPP-REVIEW…`, submit → open `issue/DEMO-41` → Spent time tab.
- **Expected:** Success confirmation with the resulting status, and a native YouTrack work item with the right author, date, duration and description.
- **Actual:** Widget confirmed the entry with the total and status; app log `Logged,75,minutes on,DEMO-41,for,admin,- status,OK` (2026-07-28 21:57:55Z). The Spent time tab showed a native work item `1h 15m`, author `admin`, today's date, the review description; the `Spent time` field rolled up accordingly.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F06-logger-success.png`, `functional-review-evidence/screenshots/F06-work-item-saved.png`

### F07 — Invalid duration is rejected without side effects
- **Test ID:** F07
- **Preconditions/data:** `DEMO-41`; work-item list captured as `[]` beforehand for a clean target issue.
- **Steps:** Submit `0`, `-30` and `abc` as the duration, in the widget and against `POST global-backend/log-time`.
- **Expected:** Rejection with a helpful message, no work item created.
- **Actual:** All three rejected with HTTP 400 and `duration must be a positive number of minutes or a period such as "2h 30m".`; work-item list still `[]`. The widget itself, however, displayed only `Error: 400` instead of that message (FF-03).
- **Result:** PASS (validation), with FF-03 recorded against the error surface
- **Screenshot(s):** `functional-review-evidence/screenshots/F07-invalid-time.png`; raw responses in `logs/f07-invalid-duration.txt`

### F08 — Threshold Configurator loads
- **Test ID:** F08
- **Preconditions/data:** Dashboard `170-4` with the Critical Threshold Configurator widget; stored config already present (`logs/threshold-config-before.txt`).
- **Steps:** Open the dashboard → wait for the widget → inspect console messages and network requests.
- **Expected:** The widget loads the stored configuration and shows editable default / project / issue limits.
- **Actual:** Permanent spinner under the "Critical time limits" heading. Console: `TypeError: Cannot read properties of undefined (reading 'scope') at l.fetchApp`. **No** network request to `global-backend/thresholds` was issued. The panel never renders any field.
- **Result:** **FAIL**
- **Screenshot(s):** `functional-review-evidence/screenshots/F08-threshold-widget-broken.png`; console capture in `logs/threshold-widget-console-errors.log`

### F09 — Threshold persistence across reload and a new session
- **Test ID:** F09
- **Preconditions/data:** Threshold config written through `POST global-backend/thresholds` (project `DEMO` = 960 min; issue limits `DEMO-40/42/43/44/45/46/47`).
- **Steps:** Reload the dashboard, then re-read the configuration in a new browser session and via `GET global-backend/thresholds`.
- **Expected:** The saved configuration is still there and visible in the configurator.
- **Actual:** Through the UI: **not verifiable** — the widget never loads (F08). Through the app's own endpoint: the full configuration persisted verbatim across reloads and sessions, with `updatedAt`/`updatedBy: admin`, and the scheduled workflow (a separate runtime) resolved exactly those numbers.
- **Result:** **FAIL** for R-UI-04 (no UI to verify in); the storage evidence is credited to R-BE-04
- **Screenshot(s):** `functional-review-evidence/screenshots/F08-threshold-widget-broken.png`; `logs/f09-f10-threshold-persistence.txt`

### F10 — Edit and delete a threshold
- **Test ID:** F10
- **Preconditions/data:** As F09.
- **Steps:** Attempt to change and remove a limit from the configurator UI.
- **Expected:** Limits can be edited and deleted from the widget.
- **Actual:** Impossible — the widget renders no controls (F08). At the endpoint level, replacing the `projects`/`issues` maps did update and remove entries, and the removal of an entry took effect for the monitor.
- **Result:** **FAIL** (UI); endpoint-level edit/delete works
- **Screenshot(s):** `functional-review-evidence/screenshots/F08-threshold-widget-broken.png`; `logs/threshold-and-monitor-setup.txt`

### F11 — Invoke the email action and verify delivery
- **Test ID:** F11
- **Preconditions/data:** `DEMO-41` with 1h 15m spent; `notificationEmails` set to one authorized recipient; `notificationsEnabled = true`.
- **Steps:** `issue/DEMO-41` → Show more → Open command dialog → type `email-time-status` → check the preview → Apply command.
- **Expected:** The command is recognised, the email is sent, and success is confirmed in YouTrack or the mail log.
- **Actual:** Preview showed `Send action email-time-status`. After applying, YouTrack showed `1 issue updated.` plus the app's own message **"Spent time report for DEMO-41 (OK) was emailed to 1 recipient(s)."** App log (22:11:12.890Z): `Spent time report for,DEMO-41,emailed to,1,recipients, status:,OK`. No email body or address is reproduced here.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F11-email-command-preview.png`, `functional-review-evidence/screenshots/F11-email-delivered.png`; `logs/f11-f12-email-action.txt`

### F12 — Email action error path
- **Test ID:** F12
- **Preconditions/data:** Same issue; app setting `notificationsEnabled` temporarily set to `false` (restored to `true` immediately afterwards — see `logs/f11-f12-email-action.txt`).
- **Steps:** Invoke `email-time-status` again from the command dialog.
- **Expected:** A clean, actionable failure with no secret leakage and no partial side effect.
- **Actual:** Error toast **"Email notifications are turned off in the Issue Ops Suite settings."** No email, comment or field change occurred; no token, header or recipient value appeared in the message.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F12-email-error.png`

### F13 — Monitor really runs every minute
- **Test ID:** F13
- **Preconditions/data:** Issue limits `DEMO-46 = 5m`, `DEMO-47 = 5m`, both with no prior alert.
- **Steps:** Logged 45m on `DEMO-46` at 22:10:02Z, then 20m on `DEMO-47` at 22:11:34Z, then read the alerts each issue received.
- **Expected:** Two automatic executions roughly one minute apart, each picking up only what was new.
- **Actual:** `DEMO-46` was alerted at **22:11:00Z** and `DEMO-47` at **22:12:00Z** — two consecutive minute executions, each firing on the minute boundary within seconds of the qualifying work item. Earlier executions at 21:39:00Z, 21:41:00Z, 22:04:00Z and 22:06:00Z show the same on-the-minute cadence.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F13-minute-executions-a.png` (DEMO-46, 45m spent), `functional-review-evidence/screenshots/F13-minute-executions-b.png` (DEMO-47, 20m spent); verbatim alert text and timestamps in `logs/f13-f17-monitor-alerts.txt` (see Blockers note B-2 about the screenshot fold)

### F14 — Below-limit issues are left alone
- **Test ID:** F14
- **Preconditions/data:** `DEMO-42` with a `600m` issue limit; 30m logged at 22:03:54Z.
- **Steps:** Let ≥8 monitor executions pass, then inspect `DEMO-42` for comments and alerts.
- **Expected:** Status OK, no alert comment, no email.
- **Actual:** The logger reported status `OK` (`Logged,30,minutes on,DEMO-42,… - status,OK`), and `DEMO-42` still has **zero** comments after more than eight executions; the issue page shows no monitor activity.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F14-below-limit.png`; `logs/f13-f17-monitor-alerts.txt`

### F15 — Boundary case: spent time exactly at the limit
- **Test ID:** F15
- **Preconditions/data:** `DEMO-43` with a `60m` issue limit; exactly 60m logged at 22:03:54Z.
- **Steps:** Wait for the next execution and read the alert.
- **Expected:** The limit is treated as reached (CRITICAL), with the status stated.
- **Actual:** At 22:04:00Z the monitor commented: `CRITICAL: DEMO-43 has 1h spent of the 1h critical limit (100%, 0m over the limit). Limit source: issue.` App log: `Critical time alert for,DEMO-43,-,CRITICAL,60,of,60,minutes`.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F15-at-limit.png` (1h spent on DEMO-43); alert text in `logs/f13-f17-monitor-alerts.txt`

### F16 — Over-limit alert content
- **Test ID:** F16
- **Preconditions/data:** `DEMO-44` limit `30m` with 2h logged through the widget; `DEMO-45` limit `10m` with 30m; `DEMO-46` limit `5m` with 45m.
- **Steps:** Read the alert each issue received.
- **Expected:** The alert names the issue, the spent time, the applicable limit and the limit status.
- **Actual:** All four required elements present in every alert, e.g. `CRITICAL: DEMO-44 has 2h spent of the 30m critical limit (400%, 1h 30m over the limit). Limit source: issue.` (22:06:00Z) and `CRITICAL: DEMO-46 has 45m spent of the 5m critical limit (900%, 40m over the limit). Limit source: issue.` (22:11:00Z). The alert is delivered both as an issue comment and as an email notification, and the limit source (issue / project / default) is stated.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F13-minute-executions-a.png` (DEMO-46 over-limit state); full alert text in `logs/f13-f17-monitor-alerts.txt`

### F17 — No alert spam on unchanged issues
- **Test ID:** F17
- **Preconditions/data:** `DEMO-43` alerted at 22:04:00Z; `alertRepeatMinutes = 120`; spent time unchanged afterwards.
- **Steps:** Let at least eight further executions run and count the alerts on `DEMO-43` (and on `DEMO-44`/`DEMO-45`, alerted at 22:06:00Z).
- **Expected:** Exactly one alert per issue until the repeat interval elapses.
- **Actual:** `DEMO-43` has exactly one comment; `DEMO-44`, `DEMO-45`, `DEMO-46` and `DEMO-47` each have exactly one. No duplicates across roughly nine executions.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F15-at-limit.png` (DEMO-43 unchanged at 1h); comment counts in `logs/f13-f17-monitor-alerts.txt`

### F18 — End-to-end: threshold → logger → work item → monitor
- **Test ID:** F18
- **Preconditions/data:** `DEMO-44`, issue limit `30m` stored through the app's configuration endpoint.
- **Steps:** Store the limit → log `2h` on `DEMO-44` from the Global Time Logger → confirm the native work item → wait for the scheduled monitor.
- **Expected:** One chain: stored threshold is honoured, the logged time becomes a native work item, and the monitor reports the resulting status.
- **Actual:** The logger confirmed `2h logged on DEMO-44 / Total spent: 2h of the 30m critical limit (issue). Current status: CRITICAL.`; app log `Logged,120,minutes on,DEMO-44,… - status,CRITICAL` (22:05:03Z); the native Spent time tab showed the 2h work item; the monitor commented at **22:06:00Z** with the CRITICAL status quoted in F16 and sent the notification. Every stage except the configurator UI worked.
- **Result:** PASS
- **Screenshot(s):** `functional-review-evidence/screenshots/F18-end-to-end-logged.png`; `logs/f13-f17-monitor-alerts.txt`

---

## 5. Findings

### FF-01 — Critical Threshold Configurator widget never loads
- **ID:** FF-01
- **Severity:** Critical (blocks R-UI-04 entirely)
- **Requirement:** R-UI-04 Threshold Configurator
- **Summary:** The widget's initial load calls `host.fetchApp('global-backend/thresholds')` with no options argument. The host API dereferences the missing options object, throws `TypeError: Cannot read properties of undefined (reading 'scope')`, and the request is never sent — so the component stays in its `loading` state forever and renders no controls. The save path at the same file passes `{method: 'POST', body}` and works, which is why the storage layer is healthy while the UI is dead.
- **Repro:** 1) Open a dashboard containing the Critical Threshold Configurator (`170-4` on the instance). 2) Wait. 3) Open the browser console.
- **Expected:** The stored configuration loads and the default / project / issue limit fields become editable.
- **Actual:** Endless spinner beneath "Critical time limits"; `TypeError … reading 'scope' at l.fetchApp` in the console; zero network requests to the thresholds endpoint.
- **Evidence:** `screenshots/F08-threshold-widget-broken.png`, `logs/threshold-widget-console-errors.log`; source location `src/widgets/critical-threshold-configurator/app.tsx:84`
- **Impact:** There is no way for any user to create, edit or delete a critical spent-time limit through the product. The only route left is a hand-crafted REST call to the app endpoint, which is not a user-facing interface. R-UI-04 is unmet.

### FF-02 — GitHub pull-request matching uses substring instead of the complete issue key
- **ID:** FF-02
- **Severity:** Major (R-UI-02 returns wrong data)
- **Requirement:** R-UI-02 GitHub Action Tracker
- **Summary:** Titles are filtered with `pull.title.toLowerCase().indexOf(issueId.toLowerCase()) >= 0`, with no key-boundary check. Any issue whose key is a prefix of another key in the same project matches the other issue's pull requests, and their Actions runs are attributed to the wrong issue.
- **Repro:** 1) Set `githubRepository` to a repo containing a PR whose title contains `DEMO-41`. 2) Open `issue/DEMO-4` (an unrelated issue). 3) Look at the GitHub Action Tracker panel.
- **Expected:** "No pull request … has DEMO-4 in its title" — only titles containing the complete key `DEMO-4` should match.
- **Actual:** `DEMO-4` lists PR #1 `YTAPP-REVIEW-20260728T2148Z DEMO-41 functional review pull request` together with all six of its workflow runs; the backend log confirms `matched pull requests:,1` for `DEMO-4`.
- **Evidence:** `screenshots/F04-github-false-positive.png`; source location `src/issue-backend.js:128-131`
- **Impact:** Users see CI history belonging to a different issue. In any project past nine issues this misattribution is routine (DEMO-1 vs DEMO-1x, DEMO-4 vs DEMO-4x), so the tracker cannot be trusted for release or review decisions.

### FF-03 — Widgets swallow the actionable error messages their own backends return
- **ID:** FF-03
- **Severity:** Minor (usability; no data loss)
- **Requirement:** R-UI-02, R-UI-03 (error surfaces)
- **Summary:** The HTTP handlers return well-written, secret-free diagnostics, but the widgets render only the transport status code, so the user sees `Error: 502` or `Error: 400` and has nothing to act on.
- **Repro:** 1) Point `githubRepository` at a non-existent repository and open the tracker. 2) Submit `abc` as a duration in the Global Time Logger.
- **Expected:** The backend's message is displayed, e.g. `GitHub responded with HTTP 404 for /repos/<owner>/<repo>/pulls` or `duration must be a positive number of minutes or a period such as "2h 30m".`
- **Actual:** `Error: 502` and `Error: 400` respectively; the useful text stays in the response body.
- **Evidence:** `screenshots/F04-github-matching-error.png`, `screenshots/F07-invalid-time.png`, `logs/f04-error-body.txt`, `logs/f07-invalid-duration.txt`
- **Impact:** A misconfigured repository or a mistyped duration looks like a broken app. Cheap to fix, and it would have made FF-01 diagnosable from the UI as well.

---

## 6. Screenshot Index

| Screenshot | Test/Requirement | What it proves | Redactions |
| --- | --- | --- | --- |
| `D01-installed-app.png` | A02, D01 / R-DEP-01 | Issue Ops Suite installed and enabled on the instance | none needed |
| `D02-app-identity.png` | A03 / R-DEP-01 | App identity and installed version `0.0.1` | none needed |
| `D03-widget-locations-mainmenu.png` | D02 / R-DEP-01 | The declared main-menu surface is registered and reachable | none needed |
| `F01-relation-graph.png` | F01 / R-UI-01 | Node/edge graph of DEMO-46's real links with relation names and directions | none needed |
| `F02-relation-empty.png` | F02 / R-UI-01 | Correct empty state for an unlinked issue | none needed |
| `F03-github-history.png` | F03 / R-UI-02 | Matching PR plus its six historical Actions runs with status and timestamps | public repo metadata only; no token |
| `F04-github-false-positive.png` | F04 / R-UI-02 | DEMO-4 wrongly showing the DEMO-41 pull request — FF-02 | none needed |
| `F04-github-matching-error.png` | F04 / R-UI-02, FF-03 | Widget shows only `Error: 502` for a failed GitHub lookup | non-existent repo name only |
| `F05-global-logger.png` | F05 / R-UI-03 | Global issue search and selection outside any issue context | none needed |
| `F06-logger-success.png` | F06 / R-UI-03 | Successful 1h 15m entry with total and status feedback | none needed |
| `F06-work-item-saved.png` | F06 / R-BE-03 | The entry as a native YouTrack work item (author, date, duration, description) | none needed |
| `F07-invalid-time.png` | F07 / R-UI-03, FF-03 | Invalid duration rejected; opaque `Error: 400` surface | none needed |
| `F08-threshold-widget-broken.png` | F08–F10 / R-UI-04 | Configurator stuck on its loader with no fields — FF-01 | none needed |
| `F11-email-command-preview.png` | F11 / R-BE-01 | `email-time-status` recognised by the command dialog (`Send action email-time-status`) | none needed |
| `F11-email-delivered.png` | F11 / R-BE-01 | App confirmation "Spent time report for DEMO-41 (OK) was emailed to 1 recipient(s)." | no recipient address or email body shown |
| `F12-email-error.png` | F12 / R-BE-01 | Actionable, secret-free failure when notifications are disabled | none needed |
| `F13-minute-executions-a.png` | F13, F16 / R-BE-02, R-BE-04 | DEMO-46 at 45m against its stored 5m limit, alerted in the 22:11:00Z execution | none needed |
| `F13-minute-executions-b.png` | F13 / R-BE-02 | DEMO-47 at 20m, alerted in the next execution, 22:12:00Z | none needed |
| `F14-below-limit.png` | F14 / R-BE-02 | DEMO-42 at 30m of a 600m limit with no monitor activity | none needed |
| `F15-at-limit.png` | F15, F17 / R-BE-02 | DEMO-43 at exactly 1h of its 1h limit, single alert only | none needed |
| `F18-end-to-end-logged.png` | F18 / R-BE-02, R-BE-03, R-BE-04 | 2h logged on DEMO-44 against the stored 30m limit, status CRITICAL | none needed |

No screenshot contains a token, cookie, authorization header or email body. Environment-variable values were never printed; the GitHub token was passed to the CLI from the environment and its output was suppressed.

---

## 7. Cleanup, Blockers, and Final Checklist

### Test data and state
Per the user's explicit instruction during this run ("do not clean up stuff, it is not needed"), the review artifacts were **deliberately retained**:

| Artifact | State at hand-off |
| --- | --- |
| Issues `DEMO-41` … `DEMO-47` (`YTAPP-REVIEW-20260728T2148Z-*`) | retained, with review work items and monitor alert comments |
| Threshold overrides in the app's global storage (`DEMO` project = 960m; issue limits for `DEMO-40/42/43/44/45/46/47`) | retained; the pre-review configuration is preserved in `logs/threshold-config-before.txt` if it ever needs restoring |
| GitHub repo `zoranrepic/ytapp-review-20260728t2148z` (private) with PR #1 and 6 CI runs | retained |
| Dashboard `170-4` hosting the two global widgets | retained |
| App setting `githubRepository` | left at `zoranrepic/ytapp-review-20260728t2148z` (original value was `JetBrains/kotlin`) |
| App setting `notificationsEnabled` | restored to `true` after F12 |
| Playwright artifacts in `generated-app/.playwright-mcp/` and two stray screenshots (`relation-widget.png`, `tmp-dashboard.png`) in `generated-app/` | retained; none of them are tracked source files, and the source checksum baseline is unaffected |

Note that `DEMO-40` and `DEMO-1` (pre-existing issues) received monitor alerts during the run because they already had spent time above the limit; those comments are also retained.

### Blockers and evidence limitations
- **B-1 (blocker for R-UI-04):** F09 and F10 could not be executed through any user interface because the configurator widget never renders (FF-01). Their storage-layer behaviour was verified through the app's own endpoint instead, and credited to R-BE-04 rather than R-UI-04.
- **B-2 (evidence limitation, R-BE-02):** the monitor screenshots (`F13-*`, `F14`, `F15`) capture each issue's state — spent time, limit-relevant fields, presence or absence of monitor activity — but YouTrack renders the alert comment below the viewport fold, so the alert *text* is not legible in them. The verbatim alert text with exact UTC timestamps and the alert counts are in `logs/f13-f17-monitor-alerts.txt` (YouTrack REST comment dump plus the app script log). Reviewers who require the alert text inside an image should re-capture full-page screenshots of `DEMO-43`, `DEMO-44` and `DEMO-46`.
- **B-3:** GitHub was observed through its REST API and through the app; the browser session was not logged in to GitHub, so clicking a PR link in the widget opens GitHub's "Page not found" for the private repo. That is a browser-session artifact, not an app defect.
- Nothing else was untestable: all nine requirements received a definite result, so the verdict is FAIL rather than BLOCKED.

### Final checklist

| Item | Status |
| --- | --- |
| A01 Instance reachable and authenticated | PASS |
| A02 App installed and enabled | PASS |
| A03 App identity confirmed live | PASS (`issue-ops-suite`, `0.0.1`) |
| A04 Installed code matches the local build | PASS |
| A05 Pre-review source baseline recorded | PASS (`logs/pre-review-checksums.txt`) |
| D01 App attached to `DEMO` | PASS |
| D02 Declared surfaces present | PASS (4/4 registered) |
| D03 App usable after deployment | PARTIAL (3/4 widgets usable) |
| F01–F02 Relation visualizer | PASS |
| F03 GitHub Actions history | PASS |
| F04 GitHub key matching / errors | FAIL |
| F05–F07 Global time logger | PASS |
| F08 Configurator loads | FAIL |
| F09–F10 Threshold persistence / edit-delete via UI | FAIL (UI); storage verified separately |
| F11–F12 Email action success and error path | PASS |
| F13–F17 Monitor cadence, boundaries, alert content, no spam | PASS (see B-2) |
| F18 End-to-end chain | PASS |
| E01 Every requirement has a result | PASS (9/9) |
| E02 Defects listed with severity and reproduction | PASS (FF-01 Critical, FF-02 Major, FF-03 Minor) |
| E03 Post-review source baseline captured and compared | PASS — 28/28 sha256 hashes identical, **source unchanged** (`logs/post-review-checksums.txt`, `logs/checksum-diff.txt`) |
| E04 Every PASS references an existing readable screenshot | PASS, with the B-2 qualification on the four monitor tests |
| E05 Created test data documented; cleanup status stated | PASS — retained by explicit user instruction, itemised above |
| No secrets exposed in the report or evidence | PASS — no tokens, cookies, headers or email bodies |
| Only this phase's outputs written | PASS — `functional-review-report.md` and `functional-review-evidence/**` only |

**Functional verdict: FAIL** — R-UI-02 (GitHub Action Tracker matches the wrong issue keys) and R-UI-04 (Threshold Configurator never loads, so critical limits cannot be managed at all).
