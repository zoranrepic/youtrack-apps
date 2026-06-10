# Custom App Endpoint: httpHandler

## Pre-requisits
- which scope family the handler belongs to (project-level vs global-level)
- the route(s): method and path per endpoint
- payload and response shape
- permission requirements (especially for global handlers)

## Anatomy
Generate an `exports.httpHandler = { endpoints: ... }` file.
Required shape:
- `exports.httpHandler`
- one endpoint object or an `endpoints` array
- endpoint `method` - The HTTP method that the endpoint implements.
- endpoint `path` - The relative path for accessing the endpoint.
- optional `scope` - The scope entity of the endpoint. Setting the scope guarantees you that the scope entity will be available in the context of the handle function.
- optional `permissions` - The list of permissions to check when someone calls the endpoint with the given method. 
- endpoint `handle(ctx)` - The function that YouTrack invokes when someone calls the endpoint with the given method.
- optional top-level `requirements` - The list of entities that are required for the script to execute without errors.

## [Context](../../api/ctx.md)
- The handle function receives a context object as its only argument. This object provides access to:
    1. `ctx.currentUser` - The current user who calls the endpoint. This property is an alias for `entities.User.current`
    2. `ctx.settings` - The app settings configured according to the app's settings schema.
    3. `ctx.globalStorage` - The global storage object provisioned for the app.
    4. `ctx.request` - The HTTP request object.
    5. `ctx.response` - The HTTP response object.
    6.  `ctx.issue, ctx.project, ctx.article, ctx.user` - The scope-specific entity for endpoints that use the corresponding scope. For example, an endpoint with scope: `issue` receives `ctx.issue`.

## Generation rules
### Scope semantics
- Pick the correct scope deliberately:
    - `ISSUE`
    - `ARTICLE`
    - `PROJECT`
    - `USER`
    - `GLOBAL`
- If `scope` is omitted, it is `GLOBAL`.
- `ISSUE`: binds the endpoint to one issue, exposes `ctx.issue`, and inherits issue visibility before code runs.
- `ARTICLE`: binds the endpoint to one article, exposes `ctx.article`, and inherits article visibility before code runs.
- `PROJECT`: binds the endpoint to one project, exposes `ctx.project`, and is reachable only in projects where the app is attached and the module is active.
- `USER`: user/global-level endpoint that exposes `ctx.user` and does not inherit project visibility.
- `GLOBAL`: app-level endpoint that is not tied to one entity and does not inherit project/entity visibility.
- `ISSUE`, `ARTICLE`, and `PROJECT` are project-level scopes.
- `USER` and `GLOBAL` are global-level scopes.
- Project-level handlers require project attachment to become reachable.
- Global-level handlers start working at the system level once the app/module is active. Attaching the app to a project does not make them project-scoped.
- Global-level HTTP handler modules require system-admin-level app management permissions.
- Project-level HTTP handler modules can be managed by project admins with project update permissions.
- Because of this separation, one handler file must stay within one scope family.

### Security and visibility
- Scoped handlers resolve to `404` before code runs when the caller cannot access the scoped entity or project.
- Project-level handlers can also resolve to `404` when the app is not attached, the module is inactive, or visibility settings hide it in that project.
- The workflow JavaScript API does not automatically filter arbitrary entity lookups by the HTTP request user's permissions.
- Calls such as `entities.Issue.findById(...)` can return an issue that `ctx.currentUser` is not allowed to view.
- Before returning data from entities loaded in handler code, check visibility with the entity security API, for example `issue.isVisibleTo(ctx.currentUser)`.
- If the loaded entity is not visible to the requester, return `404` or `403` and do not include entity data in the response.

### Routing and authoring
- Keep one handler file within one scope family: do not mix `GLOBAL`/`USER` with `ISSUE`/`ARTICLE`/`PROJECT`.
- Use exact method/path routing; keep paths simple and stable.
- HTTP handlers extend YouTrack's REST API. Third-party services can call them as webhook URLs.
- For webhooks that are not tied to one YouTrack entity, use a `GLOBAL` endpoint.
- The external URL is built from the app `name`, the handler file name without `.js`, and the endpoint `path`.
- Endpoint URL shapes:
    - `ISSUE`: `<host>/api/issues/<issueId>/extensionEndpoints/<app>/<handler>/<endpoint>`
    - `ARTICLE`: `<host>/api/articles/<articleId>/extensionEndpoints/<app>/<handler>/<endpoint>`
    - `PROJECT`: `<host>/api/admin/projects/<projectId>/extensionEndpoints/<app>/<handler>/<endpoint>`
    - `USER`: `<host>/api/users/<userId>/extensionEndpoints/<app>/<handler>/<endpoint>`
    - `GLOBAL`: `<host>/api/extensionEndpoints/<app>/<handler>/<endpoint>`
- Return only the data the caller should see.

### DON'Ts
- generate `exports.rule`
- mix global-level and project/entity-level scopes in one handler file
- expose sensitive data from a global handler without explicit protection
- return data from entities loaded by ID/search before checking visibility for `ctx.currentUser`
