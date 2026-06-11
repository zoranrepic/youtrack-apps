# Rule: action

## Overview

Targets supported: `Issue`, `IssueComment`, `IssueAttachment`, `Article`, `ArticleComment`, `ArticleAttachment`.

## Pre-requisites
Make sure to satisfy the following before generating code:

- what the user-triggered action should do
- how the user is expected to invoke it
- what entity the action applies to
- whether extra user input is needed
- what concrete instance data must exist
- what exact requirement type each referenced field needs
- whether the request is actually feasible as action

## Anatomy

Generate an `exports.rule = entities.<Target>.action({...})` file for one supported target

Required authoring shape:

- `title` - A human-readable title. The title is used as the label for the item in the list of available actions in the Show more menu of the issue.
- `command` - The text that is used for the custom command. When this command is applied to one or more issues, the actions that are defined in this rule are executed. Each action rule must have it's unique command.
- optional `guard` - The condition that determines when the action rule is enabled. If the guard condition is not met, the custom command cannot be applied to an issue. 
- `action` - The changes that should be applied to each of the issues that are selected when the command is applied. Accepts only one parameter `ctx`.
- optional `userInput` - The input that this action rule requires from the user.
- optional `requirements` - The list of entities that are required for the rule to execute without errors. This property ensures that rules can be attached to projects safely.

## Generation Rules

Choose a clear and unique `command`; prefer lowercase ASCII text that is easy to call from REST or command parsing.

```js
title: 'Request QA review',
command: 'request-qa-review'
```
---
Use userInput only for one runtime value selected or entered at execution time.

```js
userInput: {
  type: entities.Project,
  description: 'Select target project'
}
```
---
Use value/entity types in userInput.type.

```js
userInput: {
  type: entities.User,
  description: 'Select reviewer'
}

userInput: {
  type: entities.ProjectVersion,
  description: 'Select fix version'
}
```
---
Use primitive field types only for entered scalar values.

```js
userInput: {
  type: entities.Field.integerType,
  description: 'Enter story points'
}
```
---
Create or clone real issues by default unless the user asks for drafts.
```js
const followUp = new entities.Issue(ctx.currentUser, ctx.issue.project, 'Follow-up');
followUp.description = 'Created from ' + ctx.issue.idReadable;
ctx.issue.links['relates to'].add(followUp);
```

## Context
- `ctx` object recieved in `action(ctx)` and `guard(ctx)` exposes:
  1. The issue on which a corresponding command is executed 
  2. The user who executed the command.


## DON'Ts

- Do not use broad searches, large scans, or expensive loops unless explicitly required.
- Do not use dynamic or localized command text when the action must be easy to test from REST.
- Do not assume the action can be triggered by app id; execution is by action command/name in project context.
