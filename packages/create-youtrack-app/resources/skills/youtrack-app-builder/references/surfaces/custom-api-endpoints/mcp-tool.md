# MCP TOOL
## Pre-requisits
- exact tool purpose
- exact app package name and optional `aiToolPrefix`
- final published tool name expected by REST/MCP
- input arguments and JSON schema
- output shape and optional output schema
- whether the tool reads or mutates YouTrack data
- required permissions for the current user
- whether long-running work should use `asyncFunctions`

## Anatomy
```js
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.aiTool = {
  name: "get_issue_content",
  description: "Returns information about an issue by its ID",
  inputSchema: { // JSON Schema
    type: "object",
    properties: {
      issueId: {
        type: "string",
        description: "The issue ID (e.g. TEST-1234)"
      }
    },
    required: ["issueId"]
  },
  annotations: {
    title: "Get issue content",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false
  },
  execute: (ctx) => {
    const issue = entities.Issue.findById(ctx.arguments.issueId);
    return {
      id: issue.id,
      description: issue.description,
      state: issue.fields.State,
      assignee: issue.fields.Assignee?.login,
      project: {
        name: issue.project.name,
        key: issue.project.key
      }
    }
  },
  outputSchema: { // JSON Schema
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The issue ID"
      },
      description: {
        type: "string",
        description: "The issue description"
      },
      //...
    },
    required: ["id"]
  }
}
```
## [Context](../../api/ctx.md)
- `ctx` provides `ctx.arguments` from the input schema. It does not provide `ctx.issue`, `ctx.article`, or `ctx.user`; resolve entities from arguments in code.

## Generation Rules
- Required fields: name and execute.
- Use stable lowercase snake_case name.
- Custom published names are prefixed: <manifest.aiToolPrefix or packageName>_<name>.
- Add description and argument descriptions; empty descriptions make poor MCP tools.
- Add inputSchema unless the tool truly takes no arguments.
- inputSchema root type must be object or array.
- Access arguments through ctx.arguments.
- Use annotations.readOnlyHint: true only for tools that do not mutate data.
- Use annotations.subset for filtering groups like issue or article.

## Exposing custom tools
- Custom MCP tools are global system-level app modules. 
- After upload, tools are available to users across projects, but each execution uses the permissions of the authenticated user working with the MCP connection.
- Include app package names in the MCP endpoint URL: `/mcp?customToolPackages=app-name1,app-name2`.
- Use the manifest `name` value in `customToolPackages`.

## Runtime Notes
- Tools run as the authenticated current user.
- Thrown errors are returned as tool errors, not successful content.
- null and undefined results become empty content.

## DON'Ts
- Do not use root schema types like string, number, or boolean.
- Do not omit properties for object schemas or items for array schemas.
- Do not put slow external work directly in execute; schedule async work instead.
