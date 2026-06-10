---
name: youtrack-app-builder
description: Guides building, debugging, and extending JetBrains YouTrack apps and workflows. Used when scaffolding or modifying a YouTrack app, workflow rule, app endpoint or manifest.
---

# YouTrack App Builder
Build new YouTrack apps or modify existing ones. Use this file to choose the app surface, then read only the directly linked technical reference files and API references.

## Processing steps
1. First determine whether the request is a new app, a new module in an app, or a change to existing code.
2. Always read [Manifest](#manifest) when creating an app, adding a module, changing permissions/settings/package metadata, or checking whether a surface is declared.
3. See [Rules](#rules) when the request describes YouTrack automation triggered by changes, commands, schedules, or state transitions.
4. See [Custom API Endpoints](#custom-api-endpoints) when the request describes callable backend behavior such as HTTP routes, webhooks, integration callbacks, health checks, or MCP tools.
5. See [API Reference](#api-reference) only after the selected technical reference names the exact API areas needed.
6. Resolve missing instance facts before writing code: projects, fields, states, users, groups, permissions, secrets, schedules, and external endpoints.
7. See [Guidelines](#guidelines) for details on how to develop apps.
8. Implement the smallest complete app, module, or change that satisfies the request.

## Manifest
Use for app identity which is `name` and package metadata like  `title`, `description`, `vendor`, `version`. Also use it when widgets must be declared.
Load for all fields: [references/manifest.md](references/manifest.md)

## Rules
Use rules for YouTrack automation that runs from issue/article changes, explicit user commands, schedules, or constrained lifecycle transitions.

### On-Change Rule
Use when logic should run automatically as an issue or article is created, edited, reported, removed, or has a relevant field/link changed. Best for save-time validation and reactive side effects that must happen in the same transaction.
Load after selecting this surface and before codegen: [references/surfaces/rules/on-change.md](references/surfaces/rules/on-change.md)

### Action Rule
Use when the user explicitly invokes behavior from a command, button, menu item, or bulk action. Best when the user controls when the behavior runs, or when runtime `userInput` is required.
Load after selecting this surface and before codegen: [references/surfaces/rules/action.md](references/surfaces/rules/action.md)

### On-Schedule Rule
Use for periodic background work over issues selected by a YouTrack search query. Best for maintenance, reminders, escalations, cleanup, and recurring notifications that should not run during a save transaction.
Load after selecting this surface and before codegen: [references/surfaces/rules/on-schedule.md](references/surfaces/rules/on-schedule.md)

### State-Machine Rule
Use when one issue field must follow a constrained lifecycle with named states, allowed transitions, guards, actions, and optional timers. Best when free-form field edits should be replaced by an explicit transition graph.
Load after selecting this surface and before codegen: [references/surfaces/rules/state-machine.md](references/surfaces/rules/state-machine.md)

### SLA Rule
Use to define the set of time goals for tickets in a helpdesk project. 
Load after selecting this surface and before codegen: [references/surfaces/rules/sla.md](references/surfaces/rules/sla.md)

## Custom API Endpoints
Use endpoints when the app exposes callable backend behavior rather than workflow automation.

### HTTP Handler
Use for app-defined HTTP endpoints: webhook receivers, integration callbacks, health checks, or small APIs exposed by the app. 

Load after selecting this surface and before codegen: [references/surfaces/custom-api-endpoints/http-handler.md](references/surfaces/custom-api-endpoints/http-handler.md)

### MCP Tools
Use when the app exposes a callable tool for YouTrack AI or an assistant runtime. Best for narrow, well-described operations with structured inputs and outputs where the tool description controls when the AI calls it.

Load after selecting this surface and before codegen: [references/surfaces/custom-api-endpoints/mcp-tool.md](references/surfaces/custom-api-endpoints/mcp-tool.md)

## Guidelines
Use guidelines for app develpment best practices.

### Logging
Use when deciding whether to log, what level/detail to log, and how to keep logs useful without exposing sensitive data.
Load when relevant before codegen: [references/guidelines/logging.md](references/guidelines/logging.md)

## API Reference
This is the main ground truth for the YouTrack JavaScript API. When a surface reference lists API areas, resolve them here before writing code.
### Important concepts
- Async functions: [references/api/async-functions.md](references/api/async-functions.md). Load when working with deferred work. Contains the mental model, usage points, structure, constraints, prerequisites, and examples.
- [Set](references/api/set.md): Load when working with iteration over entities. YouTrack uses custom sets (not js sets) for multi-value collections. Contains properties, methods, and explanations.
- Requirements: [references/api/requirements.md](references/api/requirements.md). Load when you need to make sure entities exist in the YouTrack instance, or when code needs to retrieve required entities through `ctx`.
- Context: [references/api/ctx.md](references/api/ctx.md). Load when you need information about what is the `ctx` object and what it consist of.

### App persistence and settings
- App Settings: [references/settings.md](references/settings.md). Expose user-facing settings in the YouTrack admin UI for system and project administrators to configure the app. These settings are accessible from app code through `ctx.settings`. Load for information on required variables, scopes, lifecycle and structure.
- Extension Properties: [references/extension-properties.md](references/extension-properties.md). Load when the app needs app-owned persistent state, `entity-extensions.json`, `extensionProperties`, or `ctx.globalStorage`.

### Reading the API modules

The files in `references/api/` are the ground truth for module imports, top-level functions, and type details. Start with the module file, then follow its `Types` links for detail pages that list constructors, properties, methods, parameters, return values, and examples when available.

- Constructors: use entries under `## Constructors` as `new TypeName(args)` when the API explicitly documents a constructor.
- Properties: use entries under `## Properties` as `object.property`; check the listed type and whether the text says the value is readonly or optional.
- Methods: use entries under `## Methods` as `object.method(args)`; follow the parameter list and return text on that method.
- Functions: use entries under module `## Functions` after importing the module, for example `const workflow = require('@jetbrains/youtrack-scripting-api/workflow'); workflow.functionName(args);`.
- Types: use module `## Types` links to open the detailed page for entity objects, helper objects, and schemas.

### API Modules

| API area | Ground-truth file | Runtime import in app code |
| --- | --- | --- |
| `date-time` | [./references/api/date-time.md](./references/api/date-time.md) | `require('@jetbrains/youtrack-scripting-api/date-time')` |
| `entities` | [./references/api/entities.md](./references/api/entities.md) | `require('@jetbrains/youtrack-scripting-api/entities')` |
| `http` | [./references/api/http.md](./references/api/http.md) | `require('@jetbrains/youtrack-scripting-api/http')` |
| `license` | [./references/api/license.md](./references/api/license.md) | `require('@jetbrains/youtrack-scripting-api/license')` |
| `notifications` | [./references/api/notifications.md](./references/api/notifications.md) | `require('@jetbrains/youtrack-scripting-api/notifications')` |
| `search` | [./references/api/search.md](./references/api/search.md) | `require('@jetbrains/youtrack-scripting-api/search')` |
| `strings` | [./references/api/strings.md](./references/api/strings.md) | `require('@jetbrains/youtrack-scripting-api/strings')` |
| `workflow` | [./references/api/workflow.md](./references/api/workflow.md) | `require('@jetbrains/youtrack-scripting-api/workflow')` |
