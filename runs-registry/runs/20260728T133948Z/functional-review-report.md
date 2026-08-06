## 1. Functional Executive Summary

- Functional verdict: `FAIL`
- Requirements: `3/9 PASS, 4/9 FAIL, 2/9 BLOCKED`
- Highest-severity findings: the GitHub tracker does not expose GitHub Actions history; threshold configuration is global rather than per issue; the global time logger has no issue search/select and reports an undefined issue after saving.

The reviewed package is `issue-operations-suite` / **Issue Operations Suite** v`1.0.0`. Live access to the sanitized target host `https://exploration.youtrack.cloud` was available through Playwright. The installed app was active and attached to one project. No source files changed during review.

## 2. Environment and Deployment Results

Run: `20260728T133948Z`; generated app: `generated-app`; target project: `DEMO`. Browser automation and signed-in YouTrack access were available. GitHub PR/run test data and an authorized observable email inbox/log were not available. CLI credentials were absent (host/token values not disclosed), so app CLI deployment metadata/log queries were not used.

| Check | Steps or Command | Result | Evidence/log |
|---|---|---|---|
| A01/A02 | Read `manifest.json`; inspected declared widget locations and workflow/HTTP files | PASS | Package `issue-operations-suite`, v1.0.0; four widgets; workflow/HTTP modules identified |
| A03 | SHA-256 baseline of manifest, backend, workflows, and widget entrypoints | PASS | Pre/post hashes identical; recorded below |
| A04 | Playwright navigation to target; CLI environment-name presence check only | PASS | YouTrack/browser available; GitHub/email unavailable |
| A05 | Located issue, main-menu, and dashboard extension points in live UI | PASS | D01 screenshot and test screenshots |
| D01 | Apps administration > Issue Operations Suite | PASS | `functional-review-evidence/screenshots/D01-installed-app.png` |
| D02 | Opened app details/technical-details UI; compared available identity to local manifest | BLOCKED | UI showed title, active status, modules, and attachment but no installed semantic version/package ID; CLI auth unavailable |
| D03 | Opened issue widgets, More > Global Time Logger, Dashboard > Add widget | PASS | D01 plus F01, F05, F08 screenshots |

Source-integrity baseline/post-review (identical): `manifest.json f22b9ff536004129075f82dc5b82686fdd14fa1a7c8580246fabf88031f489f3`; `src/backend.js 1849213db95156fa14bd88c76638339e05c5f1086a788582439fca9c6d5d0f74`; `src/time-tracking.js 33740fdf4604f9853a0abdacb96672726d99aed021a14738c6f1b4509bf0178d`; `src/workflows/email-action.js eb4a91bc9c2fcd91c51b6be149e021378c63fbaf1992edef8525b6f1c5c46cd3`; `src/workflows/critical-time-monitor.js fa8288ac22efbd4d32b6cd8052657535f4ae7ae1e304ec0d14ff73f741c2011b`.

## 3. Requirement Functional Matrix

| ID | Requirement | Live Test IDs | Screenshot(s) | Functional Result | Notes |
|---|---|---|---|---|---|
| R-UI-01 | Relation Visualizer | F01, F02 | F01-relation-graph.png; F02-relation-empty.png | PASS | Real DEMO-35 relation nodes/directions and DEMO-37 empty state verified. |
| R-UI-02 | GitHub Action Tracker | F03, F04 | F04-github-matching-error.png | FAIL | No available matching PR/run fixture; reviewed implementation/live UI shows only PR links/states, not historical Actions runs, conclusions, or run links. |
| R-UI-03 | Global Time Logger | F05-F07 | F05-global-logger.png; F06-work-item-saved.png; F07-invalid-time.png | FAIL | Native work-item service works, but interface only accepts a raw issue ID, not search/select. |
| R-UI-04 | Threshold Configurator | F08-F10 | F08-threshold-created.png | FAIL | Live widget has only global minutes/percent/notifications controls; no issue selector or threshold list. |
| R-BE-01 | Email Action | F11, F12 | — | BLOCKED | No authorized observable inbox/mail log; safe action invocation was not performed to avoid sending unobservable mail. |
| R-BE-02 | Critical Time Monitor | F13-F17 | — | BLOCKED | No observable scheduler execution/mail log and the required per-issue threshold prerequisite is absent. |
| R-BE-03 | Time Tracking Service | F06, F07 | F06-work-item-saved.png; F07-invalid-time.png | PASS | One-minute work item persisted on DEMO-37; zero-minute request rejected. |
| R-BE-04 | Configuration Storage | F08-F10 | F08-threshold-created.png | FAIL | No per-user preferences, per-issue thresholds, or threshold management/persistence UI exists; source stores only app-global values. |
| R-DEP-01 | Deployment | D01-D03 | D01-installed-app.png; F01-relation-graph.png; F05-global-logger.png; F08-threshold-created.png | PASS | App active, attached, and live surfaces visible. |

## 4. Functional Test Results

| Test ID | Preconditions/data | Steps | Expected | Actual | Result | Screenshot path(s) |
|---|---|---|---|---|---|---|
| D01 | Signed-in admin | Opened Apps administration and selected app | Installed/enabled | Active Issue Operations Suite, Workflow/HTTP/Widget, attached to 1 project | PASS | `functional-review-evidence/screenshots/D01-installed-app.png` |
| D02 | Same | Opened details/technical details | ID/version matches package | Version/package ID not rendered; CLI auth unavailable | BLOCKED | D01-installed-app.png |
| D03 | DEMO issue/dashboard | Opened all declared locations | Intended surfaces visible | Issue widgets, menu logger, dashboard widget chooser visible | PASS | F01-relation-graph.png; F05-global-logger.png; F08-threshold-created.png |
| F01 | DEMO-35 (`YTAPP-REVIEW-202607241245-MainRel`) | Opened Relation Visualizer | Focused graph with real relations/directions | DEMO-35 showed Relates/Depends nodes for DEMO-36/34/33 and direction arrows | PASS | `functional-review-evidence/screenshots/F01-relation-graph.png` |
| F02 | DEMO-37 (`YTAPP-REVIEW-202607241245-EmptyRel`) | Opened Relation Visualizer | Valid empty state | “No linked issues found.” | PASS | `functional-review-evidence/screenshots/F02-relation-empty.png` |
| F03 | Matching PR with multiple historical runs | Searched tracker | Exact PR and run history | No authorized matching GitHub fixture available | BLOCKED | — |
| F04 | DEMO-37 no matching PR | Opened tracker/no-match state | Non-match excluded and API error understandable | No-match shown; no API-error fixture available | BLOCKED | `functional-review-evidence/screenshots/F04-github-matching-error.png` |
| F05 | No issue page open | Opened global logger | Search/select a test issue | Only raw “Issue ID” textbox exists; no search/select | FAIL | `functional-review-evidence/screenshots/F05-global-logger.png` |
| F06 | DEMO-37 | Logged 1 minute, prefixed description, reloaded issue | Native work item with correct detail | 01m native work item dated 28 Jul 2026 with test description appeared; logger success text incorrectly said `undefined` | PASS | `functional-review-evidence/screenshots/F06-work-item-saved.png` |
| F07 | DEMO-37 | Submitted 0 minutes | Reject/no work item | Rejected with generic save failure; console error logged | PASS | `functional-review-evidence/screenshots/F07-invalid-time.png` |
| F08 | Dashboard widget chooser | Added/opened configurator without saving | Create threshold/settings for a selected issue | Only global critical minutes, warning percent, email checkbox; no issue selection/list | FAIL | `functional-review-evidence/screenshots/F08-threshold-created.png` |
| F09 | Requires a saved issue threshold | Reload/new session | Per-issue persistence | Blocked by missing per-issue threshold feature | BLOCKED | — |
| F10 | Requires issue threshold | Edit/delete threshold | Changes persist/affect monitor | Blocked by missing threshold management feature | BLOCKED | — |
| F11 | Authorized inbox/log | Invoke email action | Observable delivery | No authorized observable destination/log | BLOCKED | — |
| F12 | Safe email error fixture | Trigger safe failure | Actionable non-secret error | No non-delivering fixture/log | BLOCKED | — |
| F13 | Scheduler logs | Observe two minute-spaced executions | Two executions | No visible scheduler execution/log access | BLOCKED | — |
| F14 | Per-issue below-limit fixture | Wait for monitor | Status/alert behavior | Blocked by missing per-issue config and execution evidence | BLOCKED | — |
| F15 | Exact-limit fixture | Wait for monitor | Boundary behavior | BLOCKED: same prerequisite | BLOCKED | — |
| F16 | Above-limit fixture | Wait for monitor | Alert with issue/spent/limit/status | BLOCKED: same prerequisite and no mail log | BLOCKED | — |
| F17 | Unchanged above-limit fixture | Wait another interval | No alert spam | BLOCKED: no scheduler/mail evidence | BLOCKED | — |
| F18 | Full per-issue configuration + mail/scheduler observability | Configure, log, observe work item and alert | End-to-end success | Work item part verified; configuration/monitor/alert prerequisites unavailable or failed | BLOCKED | F06-work-item-saved.png; F08-threshold-created.png |

## 5. Findings

- `FR-01 / High / R-UI-02`
  - Summary: GitHub Action Tracker does not provide historical GitHub Actions runs.
  - Reproduction steps: Open any issue’s tracker; inspect displayed PR data; review the deployed/local tracker surface.
  - Expected behavior: matching exact-key PR and historical run names, statuses, conclusions, and links.
  - Actual behavior: tracker displays a no-match message or PR link/state only; its visible explanatory text directs users to the linked PR for past workflow activity.
  - Screenshot or log evidence: `F04-github-matching-error.png`.
  - Impact: R-UI-02 is unfulfilled.

- `FR-02 / High / R-UI-04, R-BE-04`
  - Summary: Threshold configuration is global, not issue-specific, and cannot be managed as thresholds.
  - Reproduction steps: Add/open Critical Threshold Configurator from DEMO Dashboard.
  - Expected behavior: select an issue and create, list, edit, and delete its critical spent-time limits/notifications.
  - Actual behavior: only global critical minutes, warning percent, and an email checkbox appear; there is no issue selection or threshold list.
  - Screenshot or log evidence: `F08-threshold-created.png`.
  - Impact: issue threshold and configuration-storage requirements fail; scheduled boundary tests cannot be set up as specified.

- `FR-03 / Medium / R-UI-03`
  - Summary: Global Time Logger cannot search/select an issue and presents a misleading success message.
  - Reproduction steps: Open More > Global Time Logger; inspect controls; submit one minute to DEMO-37.
  - Expected behavior: issue search/select and accurate confirmation.
  - Actual behavior: raw ID textbox only; successful save displayed “Saved 1 minutes to undefined.”
  - Screenshot or log evidence: `F05-global-logger.png`, `F06-work-item-saved.png`.
  - Impact: required global issue-selection experience is missing and successful feedback is unreliable.

## 6. Screenshot Index

| Screenshot | Test/Requirement | What it proves | Redactions |
|---|---|---|---|
| D01-installed-app.png | D01, R-DEP-01 | Active Issue Operations Suite, app modules and project attachment | None needed |
| F01-relation-graph.png | F01, R-UI-01 | DEMO-35 real relation nodes and directions | None needed |
| F02-relation-empty.png | F02, R-UI-01 | DEMO-37 valid no-relations state | None needed |
| F04-github-matching-error.png | F04, R-UI-02 | No-match tracker state on DEMO-37 | None needed |
| F05-global-logger.png | F05, R-UI-03 | Global logger has only raw issue ID input | None needed |
| F06-work-item-saved.png | F06, R-BE-03 | DEMO-37 native 01m work item with review description | None needed |
| F07-invalid-time.png | F07, R-BE-03 | Zero duration rejected | None needed |
| F08-threshold-created.png | F08, R-UI-04/R-BE-04 | Configurator lacks issue selection/threshold management | None needed |

All indexed files were checked as readable under `functional-review-evidence/screenshots/`. `functional-review-evidence/logs/F07-console.log` is retained as supporting browser-log evidence and contains no token/cookie/private-email content.

## 7. Cleanup, Blockers, and Final Checklist

Created data: one native work item on `DEMO-37`, description `YTAPP-REVIEW-20260728T1345Z functional test`, duration 1 minute, intentionally retained as review evidence. The attempted zero-minute entry created no work item. A Critical Threshold Configurator widget was temporarily added to the existing DEMO Dashboard for UI inspection and then removed; it was not saved with any configuration. No new issues, thresholds, notification settings, PRs, or email messages were created.

Unresolved blockers: installed version/package ID not visible in UI and CLI credentials absent; no matching GitHub PR with Actions history; no authorized observable email/mail log; no scheduler execution log. These block only the explicitly marked tests and do not override proven failures.

Final checklist: A01-A05 complete; D01/D03 complete, D02 blocked; F01/F02/F06/F07 complete; F05/F08 failed; F03/F04/F09-F18 blocked or failed as recorded. Source checksums and git status were unchanged before/after relative to this app; pre-existing changes were outside the generated-app directory and were not modified.
