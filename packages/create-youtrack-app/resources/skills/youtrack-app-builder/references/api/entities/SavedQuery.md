# SavedQuery

Represents a saved search.

Parent types: `BaseEntity`, `WatchFolder`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`permittedReadUserGroups`](#permittedreadusergroups)
- [`permittedReadUsers`](#permittedreadusers)
- [`permittedUpdateUserGroups`](#permittedupdateusergroups)
- [`permittedUpdateUsers`](#permittedupdateusers)
- [`shareGroup`](#sharegroup)
- [`updateShareGroup`](#updatesharegroup)
- [`name`](#name)
- [`owner`](#owner)
- [`query`](#query)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`findQueryByName`](#findquerybyname)

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

When `true`, the entity is created in the current transaction. Otherwise, `false`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

### permittedReadUserGroups

The groups of users for whom the tag or saved search is visible.

Readonly  

Return type: [`Set.<UserGroup>`](../set.md)  

### permittedReadUsers

The users for whom the tag or saved search is visible.

Readonly  

Return type: [`Set.<User>`](../set.md)  

### permittedUpdateUserGroups

The groups of users who are allowed to update the settings for the tag or saved search.

Readonly  

Return type: [`Set.<UserGroup>`](../set.md)  

### permittedUpdateUsers

The users who are allowed to update the settings for the tag or saved search.

Readonly  

Return type: [`Set.<User>`](../set.md)  

### shareGroup

The group of users for whom the tag or saved search is visible.
If the tag or the saved search is only visible to its owner, the value for this property is `null`.
Use `folder.permittedReadUserGroups` and `folder.permittedReadUsers` instead.

Readonly  

Return type: `UserGroup`  

### updateShareGroup

The group of users who are allowed to update the settings for the tag or saved search.
If the tag or the saved search can only be updated by its owner, the value for this property is `null`.
Use `folder.permittedUpdateUserGroups` and `folder.permittedUpdateUsers` instead.

Readonly  

Return type: `UserGroup`  

### name

The name of the saved search.

Readonly  

Return type: `String`  

### owner

The user who created the saved search.

Readonly  

Return type: `User`  

### query

The search query.

Readonly  

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

### findByExtensionProperties

Searches for SavedQuery entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<SavedQuery>`](../set.md).

The set of SavedQuery entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findByName

Finds a list of saved searches with the specified name. The list only includes saved searches that are visible to the current user.
The saved searches that were created by the current user are returned at the top of the list.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the saved search to search for. |

#### Returns

Return type: [`Set.<SavedQuery>`](../set.md).

A list of saved searches that match the specified name.

### findQueryByName

Finds the most relevant saved search with the specified name that is visible to the current user.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the saved search to search for. |

#### Returns

Return type: `SavedQuery`.

The most relevant saved search.
