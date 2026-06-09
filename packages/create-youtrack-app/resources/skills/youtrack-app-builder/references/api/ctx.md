# Context
Scripting context object contains entities that are useful during rule execution. It is passed as an argument to `guard`, `action`, `handle`, `onEnter`, and `onExit` functions.
See `## Specifics on Context` for context contents for every rule or custom endpoint type.

## Common contents
- `issue`: the object of the current rule. Its origin depends on the rule type. If several issues become rule objects at the same time, rules are executed for each issue separately in no specific order.
- `currentUser`: the subject of the current rule. Its origin also depends on the rule type.

The change initiator is inherited. If execution of a scheduled rule triggers an on-change rule, the `currentUser` for the on-change rule is inherited from the scheduled rule.

## Permission Delegation
If your workflow updates private custom fields or adds new custom field values, YouTrack performs these changes even when the current user does not have the `Update Issue Private Fields` or `Update Project` permissions.
In this case, the project administrator who implements this workflow is delegating their permission to any user who triggers this workflow rule.

## Specifics on Context
This section what are the contents fo the `ctx` object and where do they come from for all surfaces.
- [On-change context](../surfaces/rules/on-change.md#context): `ctx` for on-change rule.
- [Scheduled rule context](../surfaces/rules/on-schedule.md#context): `ctx` for on-schedule rule.
- [Action rule context](../surfaces/rules/action.md#context): `ctx` for action rule.
- [State machine context](../surfaces/rules/state-machine.md#context): `ctx` for state-machine rule.
- [MCP tool context](../surfaces/custom-api-endpoints/mcp-tool.md#context): `ctx` for mcp tools.
- [HTTP handler context](../surfaces/custom-api-endpoints/http-handler.md#context): `ctx` for http handlers.

