# Functional Review Report — Ops Command Center (YouTrack App)

## 1. Functional Executive Summary

- **Functional verdict: `FAIL`**
- **Requirements: 5/9 PASS, 3/9 FAIL, 1/9 BLOCKED**
  - PASS: R-UI-01, R-UI-03, R-BE-02, R-BE-04, R-DEP-01
  - FAIL: R-UI-02, R-UI-04, R-BE-03
  - BLOCKED: R-BE-01

The app is installed, enabled, and its widgets/handlers/rules are all present in their intended
locations. The Issue Relation Visualizer and the scheduled Critical Time Monitor work well, and the
configuration/notification storage persists. However three mandatory capabilities are broken by
defects observed live:

- **F-01 (High) — `ctx.issue.idReadable` is `undefined` everywhere it is used.** The correct field
  for an Issue's readable key is `ctx.issue.id`. This single root cause breaks the **GitHub Action
  Tracker** (searches GitHub for the literal string `undefined` instead of the issue key → can never
  match a PR by issue key), corrupts monitor log lines and email content (issue key renders as
  `undefined`), and makes per-issue thresholds unresolvable.
- **F-02 (High) — Global time logging is completely broken.** `issue.addWorkItem(...)` is called with
  four positional arguments, which the scripting runtime rejects; the logger returns
  *"Failed to log time."* and creates no work item. → **R-BE-03 FAIL**.
- **F-03 (High) — The Threshold Configurator dashboard widget never loads.** Its initial
  `host.fetchApp('config/config')` GET omits the required options object, throwing
  `TypeError: Cannot read properties of undefined (reading 'scope')`; the widget is stuck on
  *"Loading configuration…"* → thresholds cannot be created or managed from the UI. → **R-UI-04 FAIL**.

Because at least one mandatory requirement fails functional review, the overall functional verdict is
**FAIL**.

---

## 2. Environment and Deployment Results

| Field | Value |
|---|---|
| Run directory | `system-test/runs/20260728T222414Z/` |
| App name / package | `ops-command-center` (title "Ops Command Center") |
| Installed app ID | `148-8225` |
| Installed version | `0.0.1` (reviewed source `package.json`: `0.0.0` — see F-06) |
| Target host (sanitized) | `https://exploration.youtrack.cloud` (project **DEMO**) |
| Browser automation | Playwright MCP — available |
| YouTrack REST/CLI | available (`youtrack-app` CLI + REST with review token) |
| GitHub test data | available (dedicated repo `zoranrepic/ytapp-review-20260728t2148z`) |
| Observable email inbox | **not available** (configured address is placeholder `ops-alerts@example.com`) |
| Dedicated test issues | available (created with `YTAPP-REVIEW-` prefix) |
| Source integrity | **UNCHANGED** — per-file SHA-1 baseline identical before/after (see logs) |

**Deployment identity / verification table**

| Check | Steps or Command | Result | Evidence/log |
|---|---|---|---|
| D01 Installed & enabled | `youtrack-app info ops-command-center` → `Global enabled: yes`; admin Apps list shows **Active** | PASS | `D01-installed-app.png`, `D02-D03-app-detail.png`, `logs/app-identity.txt` |
| D02 Installed ID/version vs package | Compared installed name `ops-command-center` / v`0.0.1` vs reviewed `package.json` name `ops-command-center` / v`0.0.0` | PASS (name matches; version bumped in deploy — F-06) | `logs/app-identity.txt`, `D02-D03-app-detail.png` |
| D03 Modules in intended locations | `youtrack-app info` → 9 modules: 4 widgets at correct extension points, 3 http-handlers, 1 on-schedule, 1 action | PASS | `logs/app-identity.txt`, `D02-D03-app-detail.png` |
| Source baseline (pre) | per-file `shasum -a 1` of `src/**`, `manifest.json` | recorded | `logs/source-baseline.txt` |
| Source baseline (post) | recomputed after testing; `diff` → identical | UNCHANGED | `logs/source-baseline-post.txt` |

---

## 3. Requirement Functional Matrix

| ID | Requirement | Live Test IDs | Screenshot(s) | Functional Result | Notes |
|---|---|---|---|---|---|
| R-UI-01 | Relation Visualizer | F01, F02 | `F01-relation-graph.png`, `F02-relation-empty.png` | **PASS** | Focus node "This issue" with correctly labelled/directed edges to real linked issues; valid empty state on an unlinked issue. |
| R-UI-02 | GitHub Action Tracker | F03, F04 | `F03-github-undefined-key.png` | **FAIL** | Widget searches GitHub for `undefined` instead of the issue key (`idReadable` bug). Cannot match a PR by issue key. (F-01) |
| R-UI-03 | Global Time Logger (interface) | F05 | `F05-global-logger.png` | **PASS** | Global logger opens without an issue context; issue search and selection and the log form work. (End-to-end save fails — that is R-BE-03.) |
| R-UI-04 | Threshold Configurator | F08, F09, F10 | `F09-F10-configurator-stuck.png`, `F08-threshold-created.png` | **FAIL** | Dashboard widget stuck on "Loading configuration…"; `fetchApp` GET missing options → `TypeError ... 'scope'`. Cannot create/manage thresholds via UI. (F-03) |
| R-BE-01 | Email Action | F11, F12 | `F11-email-action-applied.png` | **BLOCKED** | Action is invokable and applied without error ("Action rule send-status-email applied"), but delivery is unobservable (placeholder inbox `example.com`, no authorized mailbox/mail log). Content defect noted (F-01: subject/body render key as `undefined`). |
| R-BE-02 | Critical Time Monitor | F13, F14, F15, F16, F17 | `F13-F14-F16-F17-monitor-demo48.png`, `F15-monitor-boundary-demo49.png` | **PASS** | Two auto-runs 1 min apart (22:55, 22:56); OK below limit, CRITICAL at/over limit; no duplicate alert when status unchanged. Defects noted (F-01/F-04): per-issue thresholds unused, log key `undefined`. |
| R-BE-03 | Time Tracking Service | F06, F07 | `F06-log-time-failed-live.png`, `F07-invalid-time.png` | **FAIL** | Valid submit returns "Failed to log time." and creates no work item (`addWorkItem` 4-arg bug, F-02). Input validation for invalid/negative works. |
| R-BE-04 | Configuration Storage | (REST) + F13–F17 | `F13-F14-F16-F17-monitor-demo48.png`, `logs/config-storage-endpoint.txt` | **PASS** | `config` handler persists thresholds/preferences (verified via REST); persisted `defaultCriticalMinutes=480` is demonstrably consumed by the monitor. Gap: per-issue thresholds persist but are never consumed (F-04) and cannot be set via the broken UI. |
| R-DEP-01 | Deployment | D01, D02, D03 | `D01-installed-app.png`, `D02-D03-app-detail.png` | **PASS** | Installed, enabled/Active, all modules present and attachable; no broken usages. |

---

## 4. Functional Test Results

| Test | Preconditions/data | Steps | Expected | Actual | Result | Screenshot(s) |
|---|---|---|---|---|---|---|
| **D01** | app deployed | `youtrack-app info`; open admin Apps | app installed & enabled | `Global enabled: yes`; Apps list shows "Ops Command Center … Active" | PASS | `D01-installed-app.png`, `D02-D03-app-detail.png` |
| **D02** | — | compare installed vs package identity | IDs match | name matches; installed v0.0.1 vs source v0.0.0 | PASS | `D02-D03-app-detail.png`, `logs/app-identity.txt` |
| **D03** | — | list modules & extension points | all surfaces present | 4 widgets (2×ISSUE_ABOVE_ACTIVITY_STREAM, MAIN_MENU_ITEM, DASHBOARD_WIDGET), 3 http-handlers, 1 on-schedule, 1 action | PASS | `logs/app-identity.txt`, `D02-D03-app-detail.png` |
| **F01** | DEMO issue with multiple relations | open issue → Relation Visualizer | graph focused on current issue with real edges | "This issue" focus; edges "subtask of"→DEMO-41, "relates to"→DEMO-45, "depends on"→DEMO-42 | PASS | `F01-relation-graph.png` |
| **F02** | DEMO-47 (no links) | open Relation Visualizer | valid empty state, no crash | "This issue has no linked issues." | PASS | `F02-relation-empty.png` |
| **F03** | DEMO-41; repo with PRs | open GitHub Action Tracker | PR matching exact issue key + historical runs | "No pull requests in zoranrepic/ytapp-review-20260728t2148z reference **undefined**." — searches for `undefined`, not the issue key | FAIL | `F03-github-undefined-key.png` |
| **F04** | similar-but-non-matching key | observe matching/error states | non-matching PR not selected; understandable states | matching logic broken (searches `undefined`); empty-state message is readable but exposes the bug | FAIL | `F03-github-undefined-key.png` (F04-github-matching-error.png is a partial capture) |
| **F05** | no issue open | open Global Time Logger; search & select DEMO-49 | logger opens; issue selectable | logger opened globally; search returned DEMO-49; issue selected; log form rendered | PASS | `F05-global-logger.png` |
| **F06** | DEMO-49 selected | enter 15 min + description → Log time | native work item created | "Failed to log time." — no work item created (DEMO-49 spent unchanged at 480 min) | FAIL | `F06-log-time-failed-live.png`, `F06-log-time-failed.png` |
| **F07** | DEMO-38 selected | enter `-5` min → Log time | rejected, no work item | "Enter a positive number of minutes." — rejected | PASS | `F07-invalid-time.png` |
| **F08** | dashboard | open Threshold Configurator; create threshold | threshold created via UI | widget stuck "Loading configuration…"; cannot create via UI (threshold set via REST instead) | FAIL | `F08-threshold-created.png` |
| **F09** | new/reloaded session | verify persistence in widget | widget shows persisted values | widget never renders (stuck loading) → cannot verify via UI; storage itself persists via REST | FAIL | `F09-F10-configurator-stuck.png` |
| **F10** | — | edit/delete threshold; affect monitor | edits persist & change monitor | UI unusable; even persisted per-issue thresholds do not affect the monitor (F-04) | FAIL | `F09-F10-configurator-stuck.png` |
| **F11** | DEMO-49 (reported); email configured | invoke "Send status email" action | email notification sent | command available (guard passed); "Action rule send-status-email applied" (no error) | PASS (invocation) | `F11-email-action-applied.png` |
| **F12** | — | trigger safe email error case | actionable, secret-free failure | no injectable/observable email-failure path; action has no user-facing error UI; delivery inbox unavailable | BLOCKED — missing prerequisite: observable email-failure channel / authorized inbox | — |
| **F13** | DEMO-48 with spent time | observe ≥2 auto-runs | two runs ~1 min apart | comments at 22:55:00Z and 22:56:00Z (also app-log line at 22:55:00Z) | PASS | `F13-minute-executions.png` / `F13-F14-F16-F17-monitor-demo48.png` |
| **F14** | DEMO-48 = 30 min (< 480) | first run | OK status | "Spent time 30 min vs critical limit 480 min: OK." | PASS | `F14-below-limit.png` / same image |
| **F15** | DEMO-49 = 480 min (= 480) | run | documented boundary | "Spent time 480 min vs critical limit 480 min: CRITICAL." (boundary inclusive: `spent >= limit`) | PASS | `F15-at-limit.png` / `F15-monitor-boundary-demo49.png` |
| **F16** | DEMO-48 bumped to 530 (> 480) | next run | alert with spent/limit/status | "Spent time 530 min vs critical limit 480 min: CRITICAL." (attached to the issue; status/limit/spent present) | PASS | `F16-over-limit-alert.png` / same image |
| **F17** | DEMO-48 unchanged | subsequent run | no duplicate alert | no new comment at 22:57 while status stayed CRITICAL (status-change gating) | PASS | `F17-no-alert-spam.png` / same image |
| **F18** | threshold + logger + monitor | full flow | configure → log → work item → monitor status | flow **cannot complete via app UIs**: configurator broken (F-03) and logger cannot save (F-02); only the monitor half works, driven by work items created outside the app (native/REST) | FAIL | `F18-end-to-end.png` (+ `F09-F10-configurator-stuck.png`, `F06-log-time-failed-live.png`) |

---

## 5. Findings

### F-01 / High / R-UI-02, R-BE-01, R-BE-02, R-BE-04
- **Summary:** `ctx.issue.idReadable` is used as the issue's readable key but is `undefined` for Issue entities; the correct field is `ctx.issue.id`.
- **Reproduction:** Open the GitHub Action Tracker on any DEMO issue; observe the search targets `undefined`. Inspect monitor app-log lines. (Source: `src/github.js:54`, `src/workflows/critical-time-monitor.js:32,63`, `src/workflows/email-action.js:32,41`.)
- **Expected:** GitHub search uses the real issue key (e.g. `DEMO-41`); monitor/email reference the real key; per-issue thresholds keyed by the real key.
- **Actual:** GitHub widget shows *"No pull requests in … reference undefined."*; monitor app-log reads *"Critical time monitor: undefined - …"*; per-issue thresholds keyed by `undefined` never resolve.
- **Evidence:** `F03-github-undefined-key.png`; `logs/monitor-timeline.log`; `logs/app-identity.txt`.
- **Impact:** GitHub PR matching by issue key is impossible; email/monitor content and per-issue threshold resolution are corrupted.

### F-02 / High / R-BE-03
- **Summary:** Global time logging fails; `issue.addWorkItem(description, Date.now(), ctx.currentUser, minutes)` uses an unsupported 4-positional-argument form.
- **Reproduction:** Global Time Logger → search & select an issue → enter a valid duration/description → **Log time**. (Source: `src/time-tracking.js:46`.)
- **Expected:** A native work item is created with correct duration/author/date/description.
- **Actual:** *"Failed to log time."*; no work item created (verified DEMO-49 spent time unchanged at 480 min after the attempt).
- **Evidence:** `F06-log-time-failed-live.png`, `F06-log-time-failed.png`.
- **Impact:** The core "log spent time" capability of the app is non-functional.

### F-03 / High / R-UI-04, R-BE-04 (UI path)
- **Summary:** Threshold Configurator dashboard widget never loads; its initial GET `host.fetchApp('config/config')` omits the required options object.
- **Reproduction:** Open the dashboard containing the Critical Threshold Configurator. (Source: `src/widgets/threshold-config/app.tsx:35`.)
- **Expected:** Widget renders a form to create/edit/delete per-issue thresholds and notification settings.
- **Actual:** Stuck on *"Loading configuration…"*; browser console: `TypeError: Cannot read properties of undefined (reading 'scope') at l.fetchApp`.
- **Evidence:** `F09-F10-configurator-stuck.png`, `F08-threshold-created.png`.
- **Impact:** Users cannot create or manage critical spent-time limits through the intended dashboard interface.

### F-04 / Medium / R-BE-02, R-BE-04
- **Summary:** Per-issue thresholds are never applied by the monitor.
- **Reproduction:** Even with a per-issue threshold persisted in global storage, the monitor keys the lookup by `issue.idReadable` (`undefined`), so it always falls back to the global `defaultCriticalMinutes` (480). (Source: `src/workflows/critical-time-monitor.js:32`.)
- **Expected:** A per-issue threshold overrides the global default and changes monitor status.
- **Actual:** Only the global default is ever used; combined with F-03 the per-issue threshold feature is entirely unusable.
- **Evidence:** `logs/monitor-timeline.log` (DEMO-48 & DEMO-49 both evaluated against 480).
- **Impact:** The "configured boundaries per issue" behavior does not work.

### F-05 / Low / R-BE-01
- **Summary:** The email action has no user-facing success/failure feedback and no error handling; delivery is not observable in this environment.
- **Reproduction:** Invoke "Send status email"; only YouTrack's generic "applied" toast appears. Configured recipient is a placeholder `ops-alerts@example.com`.
- **Expected:** Actionable confirmation/failure that a reviewer can verify.
- **Actual:** No app-level feedback; delivery cannot be confirmed. (Also affected by F-01: subject/body render the issue key as `undefined`.)
- **Evidence:** `F11-email-action-applied.png`.
- **Impact:** Cannot independently verify email delivery; users get no error if sending fails.

### F-06 / Low (informational) / R-DEP-01
- **Summary:** Installed app version (`0.0.1`) differs from reviewed source `package.json` version (`0.0.0`).
- **Actual:** Module set and extension points match the reviewed manifest/source exactly; only the patch version differs (deploy-time bump).
- **Evidence:** `logs/app-identity.txt`.
- **Impact:** Minor identity/traceability note; no functional effect.

---

## 6. Screenshot Index

| Screenshot | Test/Requirement | What it proves | Redactions |
|---|---|---|---|
| `D01-installed-app.png` | D01 / R-DEP-01 | App installed and enabled | none |
| `D02-D03-app-detail.png` | D02, D03 / R-DEP-01 | Admin Apps detail; app Active | none |
| `F01-relation-graph.png` | F01 / R-UI-01 | Relation graph focus + labelled edges to real issues | none |
| `F02-relation-empty.png` | F02 / R-UI-01 | Valid empty state ("no linked issues") | none |
| `F03-github-undefined-key.png` | F03, F04 / R-UI-02 | GitHub tracker searches `undefined` instead of issue key | none |
| `F04-github-matching-error.png` | F04 / R-UI-02 | Partial capture (issue header only); superseded by F03 image | none |
| `F05-global-logger.png` | F05 / R-UI-03 | Global logger opens; search & select an issue | none |
| `F06-log-time-failed-live.png` | F06 / R-BE-03 | "Failed to log time." on valid input (live re-test) | none |
| `F06-log-time-failed.png` | F06 / R-BE-03 | Earlier capture of the same failure | none |
| `F07-invalid-time.png` | F07 / R-BE-03 | Negative duration rejected ("Enter a positive number…") | none |
| `F08-threshold-created.png` | F08 / R-UI-04 | Configurator stuck "Loading configuration…" | none |
| `F09-F10-configurator-stuck.png` | F09, F10 / R-UI-04 | Configurator stuck + console TypeError on `scope` | none |
| `F11-email-action-applied.png` | F11 / R-BE-01 | "Action rule send-status-email applied" toast | none |
| `F11-email-delivered.png` | F11 / R-BE-01 | Issue page context (does not itself prove delivery) | none |
| `F13-F14-F16-F17-monitor-demo48.png` | F13/F14/F16/F17 / R-BE-02 | DEMO-48 monitor comments: OK@22:55, CRITICAL@22:56, none@22:57 | none |
| `F13-minute-executions.png` | F13 / R-BE-02 | (copy) two runs ~1 min apart | none |
| `F14-below-limit.png` | F14 / R-BE-02 | (copy) below-limit OK | none |
| `F16-over-limit-alert.png` | F16 / R-BE-02 | (copy) over-limit CRITICAL with spent/limit/status | none |
| `F17-no-alert-spam.png` | F17 / R-BE-02 | (copy) no duplicate alert when status unchanged | none |
| `F15-monitor-boundary-demo49.png` | F15 / R-BE-02 | DEMO-49: 480=480 → CRITICAL (inclusive boundary) | none |
| `F15-at-limit.png` | F15 / R-BE-02 | (copy) at-limit boundary | none |
| `F18-end-to-end.png` | F18 | DEMO-48 native work items + monitor comment (working segment of the flow) | none |

All listed files exist under `functional-review-evidence/screenshots/`. No tokens, cookies, headers, or private email content appear in any screenshot.

---

## 7. Cleanup, Blockers, and Final Checklist

**Created / modified test data (prefix `YTAPP-REVIEW-`):**
- `DEMO-48` "YTAPP-REVIEW-20260729-Monitor" — created; work items +30 and +500 min; 2 monitor comments (OK, CRITICAL).
- `DEMO-49` "YTAPP-REVIEW-20260729-AtLimit" — created; work item 480 min; 1 monitor comment (CRITICAL); "Send status email" action applied once.
- Global storage: per-issue threshold(s)/preferences written via the `config` REST endpoint during R-BE-04 testing.
- Pre-existing review issues used (from the earlier test phase): `DEMO-38/41/44/47` "YTAPP-REVIEW-20260728T2148Z-*".

**Cleanup status:** Test issues, work items, and monitor comments are **retained** as durable evidence for the results above (all clearly `YTAPP-REVIEW-` prefixed for later bulk cleanup). No data was deleted.

**Configuration changes (intentionally retained; restore skipped per reviewer instruction):**
- `githubRepo` = `zoranrepic/ytapp-review-20260728t2148z` (original manifest default was `octocat/Hello-World`).
- `githubToken` = a working test token was set to exercise the GitHub handler (original setting held an invalid token). **Not restored.**
- These are app settings only; no source files were modified.

**Blockers:**
- **F12 / R-BE-01 delivery:** no authorized inbox or mail log for the configured placeholder address (`ops-alerts@example.com`), and the action exposes no user-facing error channel — email delivery could not be observed.

**Source-integrity result:** per-file SHA-1 baseline is **identical** before and after functional testing (`logs/source-baseline.txt` vs `logs/source-baseline-post.txt`). No generated-app source files were edited.

**Unchecked / not-fully-satisfied checklist items:**
- D02: PASS with a version-mismatch note (installed 0.0.1 vs source 0.0.0) — F-06.
- F03/F04 (R-UI-02): FAIL — GitHub matching broken (F-01).
- F06 (R-BE-03): FAIL — logging broken (F-02).
- F08/F09/F10 (R-UI-04): FAIL — configurator widget broken (F-03).
- F12 (R-BE-01): BLOCKED — no observable email channel.
- F18: FAIL — end-to-end flow cannot complete via app UIs (F-02, F-03).
- App-settings restore: intentionally **not performed** (per reviewer instruction).
