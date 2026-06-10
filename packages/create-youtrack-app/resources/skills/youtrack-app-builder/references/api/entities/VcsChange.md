# VcsChange

Represents a commit that is attached to an issue.

Since: `2018.1.38923`  

Parent types: `BaseEntity`, `AbstractVcsItem`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`branch`](#branch)
- [`text`](#text)
- [`user`](#user)
- [`userName`](#username)
- [`changesProcessors`](#changesprocessors)
- [`created`](#created)
- [`date`](#date)
- [`fetched`](#fetched)
- [`id`](#id)
- [`version`](#version)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`extractCommands`](#extractcommands)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`getUrl`](#geturl)
- [`isVisibleTo`](#isvisibleto)

## Properties

### becomesRemoved

When `true`, the entity is removed in the current transaction. Otherwise, `false`.
This property can become `true` only in on-change rules when the rule is triggered on the removal of an issue or an article.
In the rule code, the `runOn` rule property must contain the `removal` parameter set to `true`.

Readonly  
Since: `2017.4.37915`  

Return type: `Boolean`  

#### Examples

```javascript
runOn: {removal: true}
```

### extensionProperties

The object containing extension properties for this entity and their values.
Extension properties are custom properties that might be added to core YouTrack entities by an app.
For details about extension properties, see https://www.jetbrains.com/help/youtrack/devportal/apps-extension-properties.html.

Since: `2024.3`  

Return type: `Object`  

#### Examples

```javascript
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.action({
    command: 'test',
    action: function (ctx) {
        const printValues = () => {
            return 'stringProp:' + ctx.issue.extensionProperties.stringProp + ';'
                + 'integerProp:' + ctx.issue.extensionProperties.integerProp + ';'
                + 'booleanProp:' + ctx.issue.extensionProperties.booleanProp + ';'
                + 'issueProp:' + ctx.issue.extensionProperties.issueProp?.id + ';'
                + 'issuesProp:' + ctx.issue.extensionProperties.issuesProp?.first()?.id + ';'
        }
        ctx.issue.addComment(printValues());
    }
});
```

### isNew

This property is always `false` for VCS changes due to technical limitations.
To check whether a commit was added to an issue in the current transaction, use `ctx.issue.vcsChanges.added.isNotEmpty()`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

### branch

The name of the branch that the VCS change was committed to.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

### text

The commit message or pull request description that was provided when the change was applied to the VCS.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

### user

The user who authored the VCS change.

Readonly  
Since: `2018.1.38923`  

Return type: `User`  

### userName

The name of the change author, as returned by the VCS.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

### changesProcessors

The list of change processors that the VCS change can be retrieved from.

Readonly  
Since: `2018.1.38923`  

Return type: [`Set.<ChangesProcessor>`](../set.md)  

### created

The date when the change was applied, as returned by the VCS.

Readonly  
Since: `2018.1.39547`  

Return type: `Number`  

### date

The date when the change was applied, as returned by the VCS.
Use `VcsChange.created` instead.

Readonly  
Since: `2018.1.38923`  
Deprecated: 2018.1.39547  

Return type: `Number`  

### fetched

The date when the VCS change was retrieved from the change processor.

Readonly  
Since: `2018.1.39547`  

Return type: `Number`  

### id

A unique identifier. Used by some CI servers in addition to version.

Readonly  
Since: `2018.1.38923`  

Return type: `Number`  

### version

The version number of the change. For a Git-based VCS, the revision hash.

Readonly  
Since: `2018.1.38923`  

Return type: `String`  

## Methods

### becomes

Checks whether a field is set to an expected value in the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `expected` | `string` | The expected value. |

#### Returns

Return type: `boolean`.

If the field is set to the expected value, returns `true`.

### canBeReadBy

Checks whether a user has permission to read the field.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field. |
| `user` | `User` | The user for whom the permission to read the field is checked. |

#### Returns

Return type: `boolean`.

If the user can read the field, returns `true`.

### canBeWrittenBy

Checks whether a user has permission to update the field.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field. |
| `user` | `User` | The user for whom the permission to update the field is checked. |

#### Returns

Return type: `boolean`.

If the user can update the field, returns `true`.

### isChanged

Checks whether the value of a field is changed in the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |

#### Returns

Return type: `boolean`.

If the value of the field is changed in the current transaction, returns `true`.

### is

Checks whether a field is equal to an expected value.

Since: `2019.2.55603`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `expected` | `string` | The expected value. |

#### Returns

Return type: `boolean`.

If the field is equal to the expected value, returns `true`.

### oldValue

Returns the previous value of a single-value field before an update was applied. If the field is not changed
in the transaction, returns null.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field. |

#### Returns

Return type: `Object`.

If the field is changed in the current transaction, the previous value of the field.
Otherwise, null.

### required

Asserts that a value is set for a field.
If a value for the required field is not set, the specified message is displayed in the user interface.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `message` | `string` | The message that is displayed to the user that describes the field requirement. |

### was

Checks whether a field was equal to an expected value prior to the current transaction.

Since: `2019.2.55603`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the field to check. |
| `expected` | `string` | The expected value. |

#### Returns

Return type: `boolean`.

If the field was equal to the expected value, returns `true`.

### extractCommands

Extracts commands from vcs change on behalf of provided user

Since: `2024.4.52947`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to act as. |

#### Returns

Return type: `Array`.

List of commands that can be extracted from vcs change by provided user

### findByExtensionProperties

Searches for VcsChange entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<VcsChange>`](../set.md).

The set of VcsChange entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### getUrl

Returns the URL for a specific VCS change.

Since: `2021.2`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `processor` | `ChangesProcessor` | The entity that retrieved the VCS change and created its representation in YouTrack. |

#### Returns

Return type: `String`.

The URL of the VCS change.

### isVisibleTo

Checks whether the specified user has access to view the VCS change.

Since: `2020.1.1331`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

#### Returns

Return type: `Boolean`.

When 'true', the specified user has access to view the VCS change. Otherwise, 'false'.
