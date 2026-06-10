# Extension Properties

`entity-extensions.json` declares app-owned persistent properties on YouTrack entities. Use extension properties for mutable app state.
Scripts access declared values through `entity.extensionProperties` or by using the `findByExtensionProperties()` method on the target type.
```javascript
ctx.issue.extensionProperties.stringProp = 'value';
const current = ctx.issue.extensionProperties.stringProp;
ctx.globalStorage.extensionProperties.cacheKey = 'value';
```
An app can access only the extension properties it declares.

## Structure
Place `entity-extensions.json` at the app package root.
```json
{
  "entityTypeExtensions": [
    {
      "entityType": "Issue",
      "properties": {
        "stringProp": {
          "type": "string"
        },
        "issueProp": {
          "type": "Issue"
        },
        "issuesProp": {
          "type": "Issue",
          "multi": true
        }
      }
    }
  ]
}
```

Declaration fields:

| Field | Type | Notes |
| --- | --- | --- |
| `entityTypeExtensions` | object[] | List of entity types extended by this app. |
| `entityType` | string | Workflow/API entity type to extend. |
| `properties` | object | Map of extension-property names to declarations. |

Property fields:

| Field | Type | Notes |
| --- | --- | --- |
| `type` | string | Required. Use `string`, `integer`, `float`, `boolean`, or a YouTrack entity type supported by the Workflow API. |
| `multi` | boolean | Optional. Only for YouTrack entity references. When `true`, the property returns a YouTrack `Set`. |

## Supported Targets
The exact set of entity types is [entities](./api/entities.md). Target entity must have the `findByExtensionProperties` method.

Some commong targets are:
- [`Issue`](./api/entities/Issue.md)
- [`Project`](./api/entities/Project.md)
- [`User`](./api/entities/User.md)
- [`UserGroup`](./api/entities/UserGroup.md)

## Lifecycle
Extension property values are tied to the app declaration and are not versioned.

- Deleting the app deletes all extension property values owned by that app.
- If `entity-extensions.json` no longer declares a property, existing values for that property are deleted.
- If an app update keeps the same property name but changes its type, old values for that property are lost.

## App Global Storage
Use `AppGlobalStorage` for per-app global data that is not tied to a regular YouTrack entity.

```json
{
  "entityTypeExtensions": [
    {
      "entityType": "AppGlobalStorage",
      "properties": {
        "globalCounter": {
          "type": "integer"
        },
        "globalIssuesSet": {
          "type": "Issue",
          "multi": true
        }
      }
    }
  ]
}
```

Scripts access it through `ctx.globalStorage`:

```javascript
ctx.globalStorage.extensionProperties.globalCounter =
  (ctx.globalStorage.extensionProperties.globalCounter || 0) + 1;
ctx.globalStorage.extensionProperties.globalIssuesSet.add(ctx.issue);
```

## Usage
Regular entity access:

```javascript
ctx.issue.extensionProperties.stringProp = 'value';
const value = ctx.issue.extensionProperties.stringProp;
```

> **Quirk:** You can store JSON objects in extension properties, but only by stringifying them into a `string` property first. This is a common pattern in apps.

```javascript
ctx.issue.extensionProperties.stringProp = JSON.stringify({
  status: 'synced',
  externalId: 'CRM-42'
});

const stored = JSON.parse(ctx.issue.extensionProperties.stringProp || '{}');
```

Entity lookup access:
```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

const issue = entities.Issue.findById('DEMO-1');
const value = issue.extensionProperties.stringProp;
```
Search issues by extension properties with `search.search`:
```javascript
const search = require('@jetbrains/youtrack-scripting-api/search');

const found = search.search(ctx.issue.project, {
  query: 'State: Open',
  extensionPropertiesQuery: {
    stringProp: 'value'
  }
}, ctx.currentUser);
```

## DOs and DON'Ts
DO:
- Use extension properties for app-owned mutable state on entities.
- Use `AppGlobalStorage` for app-owned state that is global to the app.
- Use YouTrack entity references when the value should stay connected to an exact entity.

DON'T:
- Store administrator configuration in extension properties; use [settings.md](./settings.md).
- Store secrets in extension properties; there is no `secret` extension-property type.
- Expect an app to read extension properties declared by another app.
