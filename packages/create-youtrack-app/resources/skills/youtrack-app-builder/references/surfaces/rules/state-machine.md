# Rule: state-machine

## Overview
Target: `Issue`.
A state-machine owns one single-value lifecycle field. States are field values; transitions are named events.

## Pre-requisits
- exact managed field name
- exact state value names
- one initial state per machine
- transitions: source state, event name, target state
- which transitions need `guard`, `action`, or `after`
- required side effects in `onEnter`, `onExit`, and transition actions
- required fields, values, users, groups, tags, projects, or links
- REST test path: command or state-machine field event POST

## Anatomy
```js
const entities = require('@jetbrains/youtrack-scripting-api/entities');
exports.rule = entities.Issue.stateMachine({
  title: '<short name>',
  fieldName: '<managed field>',
  states: {
    '<StateName>': {
      initial: true,
      onEnter: function(ctx) {},
      onExit: function(ctx) {},
      transitions: {
        '<eventName>': {
          targetState: '<StateName>',
          guard: function(ctx) { return true; },
          action: function(ctx) {},
          after: 60 * 1000
        }
      }
    }
  },
  typeFieldName: '<type field>',
  alternativeMachines: {
    '<TypeValue>': {
      '<StateName>': {
        initial: true,
        transitions: {}
      }
    }
  },
  requirements: {}
});
```
## Context
- `ctx` object recieved in instant actions exposes:
  1. The issue where the controlled field is changed.
  2. The user who changed the value of the controlled field.
- `ctx` object recieved in `after` actions exposes:
  1. The issue where the value of the controlled field is equal to the value specified for the action.
  2. A dedicated Workflow User, which is a system user with a full set of permissions.

## Generation Rules
- Mark exactly one initial: true in every machine and sub-machine.
- Include transitions: {} on terminal states.
- Every transition needs targetState.
- State names and targetState must match real bundle values.
- Prefer short lowercase transition names like start, fix, reopen.
- guard must return a boolean.
- Execution order is source onExit, transition action, target onEnter.
- Self-transitions also run exit/action/enter; keep them idempotent.
- Declare requirements for fields and fixed entities used in guards/actions.

### Runtime
- Timer events are not scheduled for drafts or deleted issues.
- Per-type machines keep the current state only if it exists in the new effective machine; otherwise they reset to the new initial state.
- Old scheduled state-machine events for the same issue and machine are removed on state changes.
- Errors in guard/action/onEnter/onExit roll back the transaction.

## DON'Ts
- Do not set typeFieldName equal to the managed field.
- Do not omit transitions or targetState.
- Do not put slow searches, remote calls, or heavy loops inside guards or transition hooks.
- Do not invent state values, transition names, or field types from vague prompts.