# Rule: on-change

## Overview

Targets: `Issue` or `Article`.

## Pre-requisits

- what entity change should trigger the rule
- what exact field, link, creation, or removal event matters
- whether the trigger is a plain change, a specific transition, or added/removed elements in a set-like property
- what condition should gate the rule
- what concrete data must exist in the instance
- what exact requirement type each referenced field needs
- whether the request is actually feasible as onChange

## Anatomy

Generate an `exports.rule = entities.<Target>.onChange({...})` file for targets.
Required authoring shape:
- optional `title` - Human-readable title. The title is only visible in the administrative interface.
- `guard` - A function that determines the conditions for executing the rule. If the guard condition is not met, the action specified in the rule is not applied.
- `action` - The actions that should be applied to each issue. 
- `requirements` - The list of entities that are required for the rule to execute without errors. This property ensures that rules can be attached to projects safely.
- optional `runOn` - Determines which issue events trigger the on-change rule. Default is on update. Options: change - triggered on issue change, removal - triggered on issue deletion.

## Context
- `ctx` object recieved in `action(ctx)` and `guard(ctx)` exposes:
  1. The issue which is changed.
  2. The user who initiated this change.

## Generation Rules

Prefer requirement field handles for custom field delta checks and value checks.
```js
guard: function(ctx) {
  return ctx.issue.fields.becomes(ctx.State, ctx.State.Fixed);
},
requirements: {
  State: {
  type: entities.State.fieldType,
  Fixed: {}
  }
}
```
---
Use becomesReported for first report/create behavior.
```js
guard: function(ctx) {
  return ctx.issue.becomesReported;
}
```
---
Use isReported for general non-draft issue behavior.
```js
guard: function(ctx) {
  return ctx.issue.isReported &&
    ctx.issue.isChanged('description');
}
```
---
Use direct isChanged checks for built-in scalar properties.
```js
guard: function(ctx) {
  return ctx.issue.isChanged('description');
}
```
---
Compare entities by ids, logins or names.
```js
guard: function(ctx) {
  return ctx.issue.fields.Assignee &&
    ctx.issue.fields.Assignee.login === 'jane.doe';
},
requirements: {
  Assignee: {
    type: entities.User.fieldType
  }
}
```
---
Use runOn only when the rule must react to removal/change only or intentionally restrict normal change behavior.
```js
runOn: {
  removal: true
},
guard: function(ctx) {
  return ctx.issue.isReported;
}
```
---
If creating an issue as a side effect, create a real reported issue unless the user asks for draft behavior.
```js
  action: function(ctx) {
  const issue = new entities.Issue(ctx.currentUser, ctx.issue.project, 'Follow-up');
  issue.description = 'Created by workflow';
}
```
## DON'Ts

- Do not put broad searches, large scans, remote calls, or expensive loops in `guard` or `action` because onChange rule runs inside of one request api transaction.
- Do not expect a rule to re-fire in the same transaction after it has already executed.
- Do not mutate unrelated entities unless the request explicitly needs that side effect.
