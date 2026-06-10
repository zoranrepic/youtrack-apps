# Rule: on-schedule

## Overview

Target: `Issue`.

## Pre-requisits

- what volume or breadth the rule likely touches
- what issues should be processed
- what each matching issue should have changed
- what concrete instance data must exist
- what exact requirement type each referenced field needs
- whether the request is actually feasible as onSchedule

## Anatomy

Generate an `exports.rule = entities.Issue.onSchedule({...})` javascript file.

Required shape:

- optional `title` - Human-readable title. The title is only visible in the administrative interface.
- selective `search` - A search query that determines which issues are processed by this rule or a function that recalculates a search string every time the rule is triggered.
- Quartz `cron` - The schedule for applying the rule, specified as a Java cron expression.
- optional `guard` - A function that determines the conditions for executing the rule.
- `action` - The actions that should be applied to each issue that matches the search condition.
- `requirements` - The list of entities that are required for the rule to execute without errors. This property ensures that rules can be attached to projects safely.
- optional `muteUpdateNotifications` - A flag that determines whether update notifications are sent for changes applied by this rule.
- optional `modifyUpdatedProperties` - A flag that determines whether the changes applied by this rule will update the value for the updated and updated by properties in the issue.

## Context
- `ctx` object recieved in `action(ctx)` and `guard(ctx)` exposes:
1. The issue which matches the search criteria.
2. A dedicated Workflow User, which is a system user with a full set of permissions.

## Generation rules

### Runtime

- There is no global `onSchedule`. Scheduled processing is per attached project only.
- The action is applied only to issues that both match `search` and belong to the project the rule is attached to.
- Avoid broad searches plus aggressive schedules.
- Make `search` as selective as the YouTrack query syntax allows, then use `guard` only for additional selection that cannot be expressed in search.

### Search

- The query can combine attribute filters, keywords, and free text.
- When you use a function, reference it by name. For example, search: getSearchExpression.
- Encode all stated issue selection criteria in `search` when YouTrack query syntax can express them.
- Prefer `search: 'Unresolved Type: Bug'` over `search: 'Unresolved'` plus `if (ctx.issue.fields.Type.name === 'Bug')`.
- Use braces for values with spaces, for example `State: {In Progress}`.
- For multi-word custom field names:
    - after `has:`, wrap the field name in braces, for example `has: {Due Date}`, `has: -{Fix versions}`
    - before `:`, write the field name normally, for example `Due Date: .. Today`, `Fix versions: {2026.1}`
- Use `has:` when you mean field presence or absence:
    - field is present: `has: {Due Date}`
    - field is missing: `has: -{Due Date}`
    - multi-value field has any value: `has: {Fix versions}`
    - multi-value field is empty: `has: -{Fix versions}`
- To match a specific value in a multi-value field, use the field filter form, for example `Fix versions: {2026.1}`.
- Common query forms:
    - field filters like `Priority: Critical`, `Type: Bug`, `has: -Assignee`
    - tag filters like `tag: spam` or `tag: {hidden}`
    - date ranges like `updated: * .. {minus 30d}`
    - ID filters like `#ABC-123` or `issue id: ABC-123`
- Free-text terms use the same plain issue-list search, for example `important issue`.
- If processing order matters, add `sort by:` explicitly, for example `sort by: updated asc`.
- Do not add `sort by:` unless the behavior actually depends on processing order.
- `search` may be a string or a function that returns a string.
- If `search` is a function, treat it as project/search context, not issue context.
- Prefer a static search string.
- Do not add unrelated filters in `search`. Add `#Unresolved`, `Type: ...`, `tag: ...`, or other narrowing when those criteria are requested or required by the stated behavior.

### Cron / Quartz

- Treat `cron` as Quartz format.
- Keep the cron human-readable and use the least frequent schedule that still satisfies the request.
- Common Quartz examples:
    - `0 * * * * ?` = every minute
    - `0 0/5 * * * ?` = every 5 minutes
    - `0 0 * * * ?` = every hour
- If the user did not ask for a tight cadence, prefer a slower safe cadence over a noisy frequent one. Always ask for frequency if not mentioned explicitly.
- Add one short inline comment on the `cron` line that explains the schedule in plain English, for example `cron: '0 0 * * * ?', // every hour`.

### DON'Ts

- Never omit `search`
- Don't write broad `search: ""`
- Do not assume the rule runs globally across all projects in one pass
- Never add extra search restrictions that were not requested
- Don't add frequent crons


