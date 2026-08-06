# Functional Review Report — Issue Insight Suite

Run: `20260730T173549Z`
Reviewed app: `/system-test/runs/20260730T173549Z/generated-app`
Report path: `/system-test/runs/20260730T173549Z/functional-review-report.md`
Evidence: `functional-review-evidence/screenshots/`, `functional-review-evidence/logs/`

## 1. Functional Executive Summary

- **Functional verdict: `FAIL`**
- Requirements: **6/9 PASS, 2/9 FAIL, 1/9 BLOCKED**
- Highest-severity findings:
  - **F-01 (High) — R-UI-03:** The Global Time Logger main-menu surface disappeared mid-session. The route `https://exploration.youtrack.cloud/app/issue-insight-suite/global-time-logger` returned "Nope, can't find it!" on 4 consecutive attempts and the menu entry vanished from the main menu, after the widget had worked earlier in the same session. The end-to-end flow (F12) could not be completed because of this.
  - **F-02 (Medium) — R-UI-04:** The Threshold Configurator provides no delete/remove capability. Thresholds can only be created and edited; the backend supports `removeProject` but the dashboard UI never exposes it.
  - **F-03 (Medium) — R-UI-04:** Thresholds are global + per **project** only. The requirement asks for critical spent-time limits **for issues**; no per-issue threshold can be created or managed.
  - **F-04 (Low/Info) — R-BE-01:** Email dispatch is invoked successfully and the workflow reports success, but the configured recipients are non-deliverable placeholder addresses (`*@example.com`) and no mail log / authorized inbox is available on this instance, so actual delivery is unverifiable (R-BE-01 → `BLOCKED`).

## 2. Environment and Deployment Results

| Item | Value |
| --- | --- |
| App name / title | `issue-insight-suite` / "Issue Insight Suite" |
| Package version | `package.json` 0.0.0 (no `version` in `manifest.json`); YouTrack shows **Version: 0.0.1** |
| Vendor | Insight Labs |
| Installed app id (host) | `148-8321` |
| Surfaces declared | 4 widgets (`issue-relation-visualizer`, `github-action-tracker` — ISSUE_ABOVE_ACTIVITY_STREAM; `global-time-logger` — MAIN_MENU_ITEM; `critical-threshold-configurator` — DASHBOARD_WIDGET), HTTP handlers `backend.js` + `github.js`, workflows `critical-time-monitor.js` (scheduled) and `email-action.js` (issue action `send-time-report-email`) |
| Target host (sanitized) | `https://<youtrack-cloud-host>` (exploration instance), admin session |
| Browser tooling | Playwright MCP — available |
| GitHub test data | Available (dedicated test repo created for review, see §7) |
| Observable email channel | **Not available** (recipients are `@example.com`; no mail log UI on instance) |
| DEMO issues | Available (DEMO-2, DEMO-29, DEMO-30, DEMO-35 reused; DEMO-50 created) |
| Source integrity | Pre/post `shasum` baselines captured (`logs/source-checksum-pre.txt`, `logs/source-checksum-post.txt`). **No source file changed.** Only difference: build artifact `issue-insight-suite.zip` present in the post baseline (packaging output, not source, not created by review actions on source files). |

Extension labels used: "Issue Relation Visualizer", "GitHub Action Tracker", "Global Time Logger", "Critical Threshold Configurator", command `send-time-report-email`.
Dashboard used: `https://exploration.youtrack.cloud/dashboard?id=170-4`.

| Check | Direct URL or Command | Result | Evidence/log |
| --- | --- | --- | --- |
| D01 installed + enabled | `https://exploration.youtrack.cloud/admin/apps` | PASS | `screenshots/D01-installed-app.png` |
| D02 identity/version/modules | `.../admin/apps?page=1&selected=148-8321&appTab=technical` | PASS | `screenshots/D02-app-technical-details.png` |
| D03 attached to DEMO | `.../admin/apps?page=1&selected=148-8321&appTab=projects` | PASS | `screenshots/D03-app-demo-project.png` |
| Console logs | Playwright console capture | n/a | `logs/console-*.log` |

## 3. Requirement Functional Matrix

| ID | Requirement | Live Check IDs | Screenshot(s) | Functional Result | Notes |
| --- | --- | --- | --- | --- | --- |
| R-UI-01 | Relation Visualizer | F01 | `F01-relation-visualizer.png` | PASS | Graph + list matched the native links panel on DEMO-35 (relates to DEMO-36, is required for DEMO-34, depends on DEMO-33); DEMO-29/DEMO-30 show honest empty state. |
| R-UI-02 | GitHub Action Tracker | F02 | `F02-github-action-tracker.png`, `F02b-github-negative-match.png` | PASS | Matched only PR #1 containing the complete key `DEMO-29`; ignored PR titled `DEMO-290`; run names, event, status, timestamps and links to GitHub Actions runs rendered. |
| R-UI-03 | Global Time Logger | F04, F05, F12 | `F04-global-logger.png`, `F12b-global-logger-route-error.png`, `F12c-main-menu-missing-logger.png` | FAIL | Worked initially, then the route and main-menu entry became unavailable for the rest of the session (Finding F-01). |
| R-UI-04 | Threshold Configurator | F07, F08 | `F07-threshold-persisted.png`, `F08-threshold-updated.png` | FAIL | Create/edit/persist work, but no delete capability and no per-issue thresholds (Findings F-02, F-03). |
| R-BE-01 | Email Action | F03 | `F03a-email-action-command.png`, `F03-email-action.png` | BLOCKED | Action invoked, workflow returned "Time report email sent for DEMO-29."; delivery not observable (no authorized inbox/mail log). |
| R-BE-02 | Critical Time Monitor | F09, F10, F11 | `F09-minute-executions.png`, `F10-limit-status.png`, `F11-no-alert-spam.png` | PASS | Executions ~1 min apart; OK/WARNING/CRITICAL statuses with issue key, spent time and limit; no duplicate alerts. |
| R-BE-03 | Time Tracking Service | F05, F06 | `F05a-logger-submit-success.png`, `F05-work-item-saved.png`, `F06-invalid-time.png` | PASS | Native 45m work item created on DEMO-30 with author/date/description; invalid durations rejected. |
| R-BE-04 | Configuration Storage | F07, F08 | `F07-threshold-persisted.png`, `F08-threshold-updated.png` | PASS | Limits, recipients and notification toggle persisted across dashboard reloads and were consumed by the monitor. |
| R-DEP-01 | Deployment | D01, D02, D03 | `D01-installed-app.png`, `D02-app-technical-details.png`, `D03-app-demo-project.png` | PASS | Active, attached to DEMO, all four widgets + workflows + HTTP handlers registered. |

## 4. Functional Check Results

| Check ID | Direct URL | Preconditions/data | Expected | Actual | Result | Screenshot path(s) |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | `/admin/apps` | admin session | App listed and enabled | "Issue Insight Suite — Workflow, HTTP, Widget — Active", added 30 Jul 2026 17:45 | PASS | `D01-installed-app.png` |
| D02 | `/admin/apps?...&appTab=technical` | — | Installed identity matches package | Version 0.0.1 (manifest has no version field; package.json is 0.0.0), all 4 declared widgets + `backend` handler listed | PASS | `D02-app-technical-details.png` |
| D03 | `/admin/apps?...&appTab=projects` | — | Attached to DEMO | "Demo project" attached, Active | PASS | `D03-app-demo-project.png` |
| F01 | `/issue/DEMO-35`, `/issue/DEMO-30`, `/issue/DEMO-29` | DEMO-35 has 3 links | Real focus node + real neighbours + typed edges; honest empty state | Graph shows DEMO-35 centre with DEMO-36 / DEMO-34 / DEMO-33 and edge labels "relates to", "is required for", "depends on"; identical to native panel. DEMO-30/DEMO-29 show "This issue has no links to other issues." | PASS | `F01-relation-visualizer.png` |
| F02 | `/issue/DEMO-29` | Test repo `zoranrepic/ytapp-review-20260730`, PR #1 title contains `DEMO-29`, PR #2 title contains `DEMO-290` | Only complete-key PR matched; historical runs with status/time/link | "Pull requests for DEMO-29 in zoranrepic/ytapp-review-20260730 → #1 … open · zoranrepic · review-a" with runs `CI Check #7 pull_request success 7/30/2026 7:55:34 PM` and `CI Check #3 push success …`, both linking to `…/actions/runs/<id>`. PR #2 (DEMO-290) not shown. | PASS | `F02-github-action-tracker.png` |
| F02b | `/issue/DEMO-2` | Same repo | No false positive for a shorter/similar key | "No pull requests mention this issue ID in their title." | PASS | `F02b-github-negative-match.png` |
| F03 | `/issue/DEMO-29` → Apply Command `send-time-report-email` | recipients `demo-team@example.com` (project) | Action invocable; delivery observable | Command preview "Send action send-time-report-email"; after apply: "Time report email sent for DEMO-29." No inbox/mail log available to confirm delivery; no secrets leaked in messages | BLOCKED (missing observable mail channel) | `F03a-email-action-command.png`, `F03-email-action.png` |
| F04 | `/app/issue-insight-suite/global-time-logger` | none | Global logger opens, issue search/select, duration + description usable | Widget opened, query `project: DEMO #Unresolved` returned 20 DEMO issues, selecting DEMO-30 revealed "Spent time (minutes)", "Date", "Work description", "Log spent time" | PASS | `F04-global-logger.png` |
| F05 | logger → `/issue/DEMO-30` | DEMO-30 | Native work item with duration/author/date/description | Widget: "Logged 45 min to DEMO-30. Total: 0.75h."; issue shows work item `45m, 30 Jul 2026, admin, YTAPP-REVIEW-20260730T1810Z functional review time entry`, Spent time field 45m | PASS | `F05a-logger-submit-success.png`, `F05-work-item-saved.png` |
| F06 | logger | DEMO-30 | Invalid/zero/negative rejected, no work item | Submit button disabled for `-15`, `0` and empty; no work item created (Spent time stayed 45m) | PASS | `F06-invalid-time.png` |
| F07 | `/dashboard?id=170-4` | widget added to dashboard | Threshold + notification settings persist after reload | Saved warning 0.5h / critical 1h, recipients `ytapp-review-20260730@example.com`, notify=on, project override DEMO; after full reload all values and "DEMO: warning 0.5h / critical 1h" persisted | PASS | `F07-threshold-persisted.png` |
| F08 | `/dashboard?id=170-4` | existing DEMO override | Edit **and delete** persist | Edit persisted (DEMO override → warning 0.25h / critical 0.5h after reload). **Delete not possible** — widget exposes only "Save thresholds"; no remove control for global or project entries | FAIL | `F08-threshold-updated.png` |
| F09 | `/issue/DEMO-30` | DEMO-30 spent 0.75h, thresholds changed between runs | ≥2 automatic executions ~1 min apart | Workflow comments at T ("… 1h critical limit … Status: WARNING.") and T+1 min ("… 0.5h critical limit … Status: CRITICAL.") authored by "YouTrack Workflow" | PASS | `F09-minute-executions.png` |
| F10 | `/issue/DEMO-30` | thresholds 0.5/1 → 0.25/0.5 → 2/3 | below/at/above limit behaviour with key, spent, limit, status, alert | Three automatic comments observed: `Status: WARNING` (0.75h vs 1h/0.5h), `Status: CRITICAL` (0.75h vs 0.5h/0.25h), `Status: OK` (0.75h vs 3h/2h) — each with issue key, spent time, both limits, and alert comment | PASS | `F10-limit-status.png` |
| F11 | `/issue/DEMO-30` | issue unchanged for ≥3 further monitor cycles | No duplicated alerts | Only one comment per status transition; repeated executions with unchanged status produced no additional comments | PASS | `F11-no-alert-spam.png` |
| F12 | `/dashboard?id=170-4`, `/app/issue-insight-suite/global-time-logger`, `/issue/DEMO-50` | thresholds DEMO 2h/3h, new issue DEMO-50 | Threshold → log time → work item → monitor status | Threshold configured; issue DEMO-50 created; **global logger route returned "Nope, can't find it!" and the main-menu entry disappeared**, so no time could be logged; DEMO-50 Spent time remained `?` and no monitor alert applies | FAIL | `F12-end-to-end.png`, `F12b-global-logger-route-error.png`, `F12c-main-menu-missing-logger.png` |

## 5. Findings

### F-01 / High / R-UI-03 (also blocks R-BE-03 end-to-end)
- **Summary:** Global Time Logger main-menu surface becomes unavailable during normal use.
- **Reproduction steps:** 1) Open `https://exploration.youtrack.cloud/app/issue-insight-suite/global-time-logger` (works, logs time). 2) Continue the session (dashboard widget saves, project-level app settings save, issue creation). 3) Re-open the same URL and the main menu "More" list.
- **Expected behavior:** The global logger route and main-menu item remain available for the whole session.
- **Actual behavior:** Route renders YouTrack's "Nope, can't find it!" page; console logs `Could not find widget "issue-insight-suite:global-time-logger"`; the menu entry is gone from the main menu (another app's logger entry is still present, so this is app-specific).
- **Evidence:** `F12b-global-logger-route-error.png`, `F12c-main-menu-missing-logger.png`, `logs/console-2026-07-30T18-13-38-996Z.log`
- **Impact:** The only global time-logging entry point is unusable; the required end-to-end flow cannot be completed.

### F-02 / Medium / R-UI-04
- **Summary:** Thresholds cannot be deleted from the dashboard interface.
- **Reproduction steps:** Open the dashboard widget, create a project threshold, look for any delete/remove control on the entry list.
- **Expected behavior:** "Create and manage" implies removal of a configured limit.
- **Actual behavior:** Only "Save thresholds" exists; the list entry `DEMO: warning …h / critical …h` has no controls. (`src/backend.js` supports `removeProject`, but no UI calls it — `grep` for remove/delete in the widget returns nothing.)
- **Evidence:** `F08-threshold-updated.png`
- **Impact:** Obsolete limits stay active forever and keep the monitor alerting; the management half of the requirement is missing.

### F-03 / Medium / R-UI-04
- **Summary:** Thresholds are global/per-project, not per-issue.
- **Reproduction steps:** Open the dashboard widget; the only scoping field is "Project short name".
- **Expected behavior:** Create and manage critical spent-time limits **for issues**.
- **Actual behavior:** Only a global default and per-project overrides can be stored; there is no way to give a specific `DEMO-*` issue its own limit.
- **Evidence:** `F07-threshold-persisted.png`, `F08-threshold-updated.png`
- **Impact:** Issue-level limit management, as specified, is not delivered.

### F-04 / Low / R-BE-01
- **Summary:** Email delivery is not observable.
- **Reproduction steps:** Apply `send-time-report-email` on DEMO-29 with recipients `demo-team@example.com`.
- **Expected behavior:** Delivery verifiable in an authorized inbox or mail log.
- **Actual behavior:** Workflow reports "Time report email sent for DEMO-29."; recipients are placeholder addresses and the instance exposes no mail log for app notifications. Failure path is safe: with a bad repository value the GitHub widget returned a generic message with no token/secret exposure.
- **Evidence:** `F03-email-action.png`, `F03a-email-action-command.png`
- **Impact:** R-BE-01 cannot be confirmed beyond invocation.

### F-05 / Low / R-DEP-01
- **Summary:** No `version` declared in `manifest.json`; host reports 0.0.1 while `package.json` says 0.0.0.
- **Evidence:** `D02-app-technical-details.png`
- **Impact:** Version traceability between package and deployment is weak.

## 6. Screenshot Index

| Screenshot | Check/Requirement | What it proves | Redactions |
| --- | --- | --- | --- |
| `D01-installed-app.png` | D01 / R-DEP-01 | App listed Active in `/admin/apps` | none needed |
| `D02-app-technical-details.png` | D02 / R-DEP-01 | Version 0.0.1, all widgets + backend handlers registered | none |
| `D03-app-demo-project.png` | D03 / R-DEP-01 | App attached to Demo project | none |
| `F01-relation-visualizer.png` | F01 / R-UI-01 | DEMO-35 graph with real typed relations, matching native panel | none |
| `F02-github-action-tracker.png` | F02 / R-UI-02 | DEMO-29 matched PR #1 with Actions run history, statuses, timestamps, links | GitHub token never displayed (setting shown masked) |
| `F02b-github-negative-match.png` | F02 / R-UI-02 | DEMO-2 correctly matches nothing | none |
| `F03a-email-action-command.png` | F03 / R-BE-01 | Command dialog previewing `send-time-report-email` on DEMO-29 | none |
| `F03-email-action.png` | F03 / R-BE-01 | Workflow success message after invoking the action | recipient addresses are placeholders |
| `F04-global-logger.png` | F04 / R-UI-03 | Global logger with issue search results and duration/description controls | none |
| `F05a-logger-submit-success.png` | F05 / R-BE-03 | "Logged 45 min to DEMO-30. Total: 0.75h." | none |
| `F05-work-item-saved.png` | F05 / R-BE-03 | Native work item on DEMO-30 (45m, date, author, description) | none |
| `F06-invalid-time.png` | F06 / R-BE-03 | Negative duration rejected, submit disabled, no work item | none |
| `F07-threshold-persisted.png` | F07 / R-UI-04, R-BE-04 | Threshold + recipients + notify persisted after dashboard reload | test recipient is a placeholder address |
| `F08-threshold-updated.png` | F08 / R-UI-04 | Edited threshold persisted; no delete control present | none |
| `F09-minute-executions.png` | F09 / R-BE-02 | Two automatic monitor comments ~1 minute apart | none |
| `F10-limit-status.png` | F10 / R-BE-02 | OK / WARNING / CRITICAL statuses with key, spent time, limits | none |
| `F11-no-alert-spam.png` | F11 / R-BE-02 | No duplicate alerts while the issue stays unchanged | none |
| `F12-end-to-end.png` | F12 | DEMO-50 with no spent time — flow incomplete | none |
| `F12b-global-logger-route-error.png` | F12 / R-UI-03 | Global logger route not found | none |
| `F12c-main-menu-missing-logger.png` | F12 / R-UI-03 | Main menu no longer lists the app's Global Time Logger | none |

All listed files exist under `functional-review-evidence/screenshots/`.

## 7. Blockers and Final Checklist

**Created/retained test data (kept as evidence):**
- YouTrack issue `DEMO-50` — `YTAPP-REVIEW-20260730T1830Z-E2E` (empty, E2E blocked).
- Work item on `DEMO-30`: 45m, `YTAPP-REVIEW-20260730T1810Z functional review time entry`.
- Automatic monitor comments on `DEMO-30` (WARNING / CRITICAL / OK).
- App configuration storage: global warning 0.5h, critical 1h, recipients `ytapp-review-20260730@example.com`, notify on; project override `DEMO: warning 2h / critical 3h`.
- Dashboard widget "Critical Threshold Configurator" added to dashboard `170-4`.
- GitHub test repo `zoranrepic/ytapp-review-20260730` with workflow `CI Check`, PR #1 (`… DEMO-29 pipeline test`) and PR #2 (`… DEMO-290 unrelated pipeline`) plus their Actions runs.
- Settings changed for testing (not restored): global and project-level `githubRepository` now point at the test repo (previously `JetBrains/youtrack`); project-level recipients/limits replaced by review values.

**Unresolved blockers:**
- No authorized inbox or mail log for verifying R-BE-01 delivery.
- R-UI-03/F12 blocked by defect F-01 (app surface disappeared), not by tooling.

**Source integrity:** source files unchanged between pre- and post-review baselines; the only new path in the post baseline is the build artifact `issue-insight-suite.zip`. No files in the generated app were edited by this review.

**Unchecked checklist items:** none — A01–A05, D01–D03, F01–F12 and E01–E05 were all executed; F08 (delete) and F12 (end-to-end) were executed and failed rather than skipped.
