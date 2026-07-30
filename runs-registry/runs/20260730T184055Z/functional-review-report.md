# Functional Review Report

## 1. Functional Executive Summary

- **Functional verdict: `FAIL`**
- **Requirements: 1/9 PASS, 7/9 FAIL, 1/9 BLOCKED**
- Highest-severity findings:
  - The Global Time Logger is live but its issue selector contains no `DEMO-*` issues, so it cannot log time to the required project (F04/F05/F06; R-UI-03 and R-BE-03).
  - The threshold widget exposes one project-wide minute value only; it has no issue selector, per-issue threshold records, notification controls, or edit/delete workflow (F07/F08; R-UI-04 and R-BE-04).
  - The GitHub widget displays a no-PR state and its reviewed implementation has no GitHub Actions-run retrieval/rendering, so the required historical run/status/link behavior is absent (F02; R-UI-02).
  - The relation-visualizer surface was invoked on linked issue `DEMO-46`, but no readable graph rendered; the visible issue relation remained native YouTrack content (F01; R-UI-01).

## 2. Environment and Deployment Results

- Run directory: `/Users/zoran.repic/Documents/Projects/youtrack-app-agent-kit/system-test/runs/20260730T184055Z`
- App directory: `generated-app`
- App package ID/name: `issue-delivery-control-center`; title: **Issue Delivery Control Center**; source version: `1.0.0`.
- Intended surfaces from the manifest: Issue Relation Visualizer, GitHub Action Tracker, Global Time Logger, and Critical Threshold Configurator; plus email action, scheduled monitor, and `time-entry` HTTP service.
- Target host: `https://exploration.youtrack.cloud` (sanitized; no credentials or secrets recorded).
- Availability: authenticated YouTrack and Playwright browser automation were available. `DEMO` had 43 issues, including retained review issues `DEMO-29`, `DEMO-30`, `DEMO-40`, `DEMO-41`, `DEMO-46`, and `DEMO-50`. No authorized observable mailbox/mail log or GitHub Actions test-run feed was available.
- Source integrity: pre-review all-non-`node_modules` tree checksum was `8fa16482d87b903fd57ef1c4f5cece63dcbcb0d2c8f40d11526e114cfbdf6381`. No app file was edited. Normalized post-review application-tree checksum (excluding transient `.playwright-mcp`) is in `functional-review-evidence/logs/post-source-tree-sha256.txt`; source is assessed **unchanged**. The directory did not provide usable Git-status output.

| Check | Direct URL or Command | Result | Evidence/log |
|---|---|---|---|
| D01 | `https://exploration.youtrack.cloud/admin/apps` | PASS | `functional-review-evidence/screenshots/D01-installed-app.png` |
| D02 | `https://exploration.youtrack.cloud/admin/apps?title=Issue%20Delivery%20Control%20Center` | BLOCKED | Admin listing proved active installation but did not expose an installed version/package identifier. |
| D03 | `https://exploration.youtrack.cloud/issue/DEMO-46`; `https://exploration.youtrack.cloud/dashboard?id=170-4` | PASS | F01/F07 screenshots show app extension availability in DEMO issue/dashboard context. |
| Browser/tooling | Playwright against target host | PASS | Live screenshots listed in section 6. |
| GitHub/e-mail observability | No authorized PR run feed or inbox/mail log supplied | BLOCKED | No secret-bearing probes performed. |

Exact live URLs/data used: `DEMO-46` for issue context; global logger route `https://exploration.youtrack.cloud/app/issue-delivery-control-center/global-time-logger`; dashboard `https://exploration.youtrack.cloud/dashboard?id=170-4`.

## 3. Requirement Functional Matrix

| ID | Requirement | Live Check IDs | Screenshot(s) | Functional Result | Notes |
|---|---|---|---|---|---|
| R-UI-01 | Relation Visualizer | F01 | `F01-relation-visualizer.png` | FAIL | Linked `DEMO-46` did not present a readable app node-and-edge graph after invoking the relation widget. |
| R-UI-02 | GitHub Action Tracker | F02 | `F02-github-action-tracker.png` | FAIL | Live widget showed no linked PR; reviewed app behavior supplies PR metadata only, not historical Actions runs/statuses/conclusions. |
| R-UI-03 | Global Time Logger | F04, F05, F06 | `F04-global-logger.png` | FAIL | Logger route opens, but selector had no `DEMO-*` options; no required selected-issue logging flow can be completed. |
| R-UI-04 | Threshold Configurator | F07, F08 | `F07-threshold-persisted.png`, `F08-threshold-updated.png` | FAIL | Only a single project-level numeric boundary/draft save is present; no issue threshold or notification management/edit/delete. |
| R-BE-01 | Email Action | F03 | `F03-email-action.png` | BLOCKED | No configured authorized recipient or observable delivery channel; action could not be safely invoked/delivered live. |
| R-BE-02 | Critical Time Monitor | F09, F10, F11 | — | FAIL | No per-issue thresholds/status output exists in the dashboard; therefore required per-issue boundary comparison/alert behavior is not usable. No two-run evidence available. |
| R-BE-03 | Time Tracking Service | F05, F06 | `F04-global-logger.png` | FAIL | Service cannot be reached through the required DEMO logger flow because the issue selector omits DEMO issues. |
| R-BE-04 | Configuration Storage | F07, F08 | `F07-threshold-persisted.png`, `F08-threshold-updated.png` | FAIL | UI contains neither user preferences nor per-issue threshold records/notification settings to persist/manage. |
| R-DEP-01 | Deployment | D01, D03 | `D01-installed-app.png`, `F07-threshold-persisted.png` | PASS | App is listed Active and its global/dashboard/issue extensions are reachable. D02 version identity remains blocked. |

## 4. Functional Check Results

| Check ID | Direct URL | Preconditions/data | Expected | Actual | Result | Screenshot path(s) |
|---|---|---|---|---|---|---|
| D01 | `https://exploration.youtrack.cloud/admin/apps` | Authenticated admin | App installed and enabled | Filtered administration row shows **Issue Delivery Control Center**, type Workflow/HTTP/Widget, status **Active**. | PASS | `functional-review-evidence/screenshots/D01-installed-app.png` |
| D02 | Admin apps URL | Source package `issue-delivery-control-center`, v1.0.0 | Installed ID/version matches source | Active row did not expose version/package ID. | BLOCKED | D01 screenshot (identity title only) |
| D03 | `https://exploration.youtrack.cloud/issue/DEMO-46`; dashboard URL | Existing DEMO issue/dashboard | Usable from DEMO | Issue extension entry and dashboard widget were available. | PASS | `functional-review-evidence/screenshots/F01-relation-visualizer.png`; `F07-threshold-persisted.png` |
| F01 | `https://exploration.youtrack.cloud/issue/DEMO-46` | `DEMO-46` has native subtask relation to `DEMO-41` | Focused node/edge graph with understandable relation | After widget invocation no readable graph appeared; screenshot shows native relation and GitHub widget, not app graph. | FAIL | `functional-review-evidence/screenshots/F01-relation-visualizer.png` |
| F02 | `https://exploration.youtrack.cloud/issue/DEMO-46` | Issue context; no authorized GitHub run feed | Complete-key PR match plus historical runs/statuses/timestamps/links | Widget says “No linked pull requests found”; no Actions-run history/status/conclusion appears. | FAIL | `functional-review-evidence/screenshots/F02-github-action-tracker.png` |
| F03 | `https://exploration.youtrack.cloud/issue/DEMO-46` | No configured observable notification email/inbox | Invoke and observe delivery/actionable failure | No safe observable recipient/channel; did not send mail. | BLOCKED | `functional-review-evidence/screenshots/F03-email-action.png` |
| F04 | `https://exploration.youtrack.cloud/app/issue-delivery-control-center/global-time-logger` | Opened globally, no issue preselected | Select a `DEMO-*` issue and use duration/description | Controls render, but option inspection found no `DEMO-29`, `DEMO-40`, `DEMO-41`, `DEMO-46`, or `DEMO-50`; Log time remains disabled. | FAIL | `functional-review-evidence/screenshots/F04-global-logger.png` |
| F05 | Global logger then `https://exploration.youtrack.cloud/issue/DEMO-46` | Requires selectable DEMO issue | Save native work item with duration/author/date/description | Not attempted: F04 prevents selecting DEMO issue and submitting safely. | BLOCKED | — |
| F06 | Global logger | Requires selectable DEMO issue | Reject invalid/zero/negative duration without work item | Not attempted: logger cannot select DEMO issue; submit stays disabled. | BLOCKED | — |
| F07 | `https://exploration.youtrack.cloud/dashboard?id=170-4` | Added only Critical Threshold Configurator widget to existing empty review dashboard | Create per-issue threshold and notification settings, reload persistence | Widget has only “Critical boundary (minutes)” = 480 and “Save dashboard draft”; no issue or notification control. | FAIL | `functional-review-evidence/screenshots/F07-threshold-persisted.png` |
| F08 | Dashboard URL | Widget from F07 | Edit/delete per-issue threshold and verify persistence | No threshold list/records, edit controls, or delete controls exist. | FAIL | `functional-review-evidence/screenshots/F08-threshold-updated.png` |
| F09 | Dashboard/issue URLs | Requires a usable saved issue threshold and observable monitor logs/notifications | Two automatic executions ~1 min apart | BLOCKED by absent per-issue threshold and no observable app execution log/notification channel. | BLOCKED | — |
| F10 | Dashboard/issue URLs | Requires F07 threshold and logged work | Below/at/above status with alert evidence | BLOCKED by unusable issue-specific configuration and no status output. | BLOCKED | — |
| F11 | Dashboard/issue URLs | Requires monitor output and unchanged issue | Prove no duplicate alert spam | BLOCKED: no notification/log observation channel and F09 unavailable. | BLOCKED | — |
| F12 | Dashboard, logger, issue URLs | Requires F04/F07/F09 workable | Configure, log, native work item, monitor notification | BLOCKED because logger cannot select DEMO and threshold configuration is not per issue. | BLOCKED | — |

## 5. Findings

- **FR-01 / High / R-UI-03, R-BE-03**
  - **Summary:** Global Time Logger cannot select issues in the required `DEMO` project.
  - **Reproduction steps:** Open global logger route; open Issue selector; inspect/search available values for existing `DEMO-29`, `DEMO-40`, `DEMO-41`, `DEMO-46`, or `DEMO-50`.
  - **Expected behavior:** A reviewer can select a `DEMO-*` issue, log a valid duration/description, and observe its native work item.
  - **Actual behavior:** No tested DEMO identifiers were offered; Log time remained disabled.
  - **Screenshot or log evidence:** `functional-review-evidence/screenshots/F04-global-logger.png`.
  - **Impact:** Required global time logging and its end-to-end backend service cannot be used for the target project.

- **FR-02 / High / R-UI-04, R-BE-02, R-BE-04**
  - **Summary:** Threshold configurator is a project-wide numeric setting, not an issue-threshold management dashboard.
  - **Reproduction steps:** Add Critical Threshold Configurator to dashboard `id=170-4`; review available controls.
  - **Expected behavior:** Create/manage thresholds and notification settings for selected DEMO issues, including edit/delete and persistence.
  - **Actual behavior:** One 480-minute input and “Save dashboard draft” only; no issue picker, notification settings, records/list, edit, or delete.
  - **Screenshot or log evidence:** `functional-review-evidence/screenshots/F07-threshold-persisted.png`; `F08-threshold-updated.png`.
  - **Impact:** The scheduled monitor has no usable per-issue configuration/status source; persistence requirement is incomplete.

- **FR-03 / High / R-UI-02**
  - **Summary:** GitHub Action Tracker does not provide historical GitHub Actions run data.
  - **Reproduction steps:** Open `DEMO-46` and inspect GitHub Action Tracker; compare displayed fields to required run name/status/conclusion/timestamp/link behavior.
  - **Expected behavior:** Matching complete issue-key PRs show historical action runs with status/conclusion, timestamps, and links.
  - **Actual behavior:** Live widget displays “No linked pull requests found”; no run-history surface exists. The minimum implementation inspection also found only linked PR metadata rendering, no Actions-run query/model.
  - **Screenshot or log evidence:** `functional-review-evidence/screenshots/F02-github-action-tracker.png`.
  - **Impact:** The stated GitHub Actions tracking function is unavailable.

- **FR-04 / Medium / R-UI-01**
  - **Summary:** Relation graph is not visibly rendered for a known linked issue.
  - **Reproduction steps:** Open `DEMO-46`, which visibly has a subtask relation to `DEMO-41`; invoke Issue Relation Visualizer.
  - **Expected behavior:** Focused issue and real related issue(s) shown as labeled/directed graph nodes/edges.
  - **Actual behavior:** No readable graph rendered; native subtask link is all that is visible.
  - **Screenshot or log evidence:** `functional-review-evidence/screenshots/F01-relation-visualizer.png`.
  - **Impact:** Users cannot visualize real issue dependencies.

## 6. Screenshot Index

| Screenshot | Check/Requirement | What it proves | Redactions |
|---|---|---|---|
| `D01-installed-app.png` | D01 / R-DEP-01 | Filtered Apps administration row identifies Issue Delivery Control Center as Active. | None required; no secret values visible. |
| `F01-relation-visualizer.png` | F01 / R-UI-01 | `DEMO-46` context and native linked subtask; no readable graph is present after invocation. | None. |
| `F02-github-action-tracker.png` | F02 / R-UI-02 | `DEMO-46` GitHub Action Tracker shows no linked PRs and no historical run data. | None. |
| `F03-email-action.png` | F03 / R-BE-01 | Issue context used for blocked e-mail check; no mail/action secrets exposed. | None. |
| `F04-global-logger.png` | F04 / R-UI-03 | Global logger route, issue/duration/description controls, and disabled submission state. | None. |
| `F07-threshold-persisted.png` | F07 / R-UI-04 | Dashboard URL context and only single boundary/draft UI. | None. |
| `F08-threshold-updated.png` | F08 / R-UI-04 | Same dashboard widget has no record-management or delete UI. | None. |

All listed files were verified present under `functional-review-evidence/screenshots/`.

## 7. Blockers and Final Checklist

- **Created/retained data:** No issue, work item, threshold, notification, PR, or email was created by this review. The dashboard widget was added to the pre-existing review dashboard `https://exploration.youtrack.cloud/dashboard?id=170-4` as explicitly permitted for the check. Existing retained DEMO review data used: `DEMO-46` (linked graph test); observed available test issues include `DEMO-29`, `DEMO-30`, `DEMO-40`, `DEMO-41`, `DEMO-50`.
- **Unresolved blockers:** installed version/package ID not displayed in admin list (D02); no authorized observable mailbox/mail log (F03); no GitHub Actions test feed; F05/F06/F09-F12 cannot proceed because prerequisite UI functions failed.
- **Integrity:** no generated-app source files were changed; only required report/evidence paths were written.
- **Checklist items not completed as PASS:** A04 GitHub/email observability unavailable; D02 installed version identity blocked; F03 delivery blocked; F05/F06 blocked by F04; F09-F12 blocked by failed/absent prerequisites. All mandatory requirements have an explicit PASS/FAIL/BLOCKED result.
