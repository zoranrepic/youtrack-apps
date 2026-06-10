# ProjectTeam

Represents a project team. To access a project team in a workflow, use the `team` property of a `Project` object, such as `ctx.issue.project.team`, or the `teams` property of a `User` object. In rule requirements, reference a project team as a `UserGroup` by name.

Parent types: `BaseEntity`, `UserGroup`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`allUsersGroup`](#allusersgroup)
- [`description`](#description)
- [`fieldType`](#fieldtype)
- [`isAllUsersGroup`](#isallusersgroup)
- [`isAutoJoin`](#isautojoin)
- [`name`](#name)
- [`users`](#users)
- [`project`](#project)

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
- [`notifyAllUsers`](#notifyallusers)

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

### allUsersGroup

The All Users group.

Readonly  

Return type: `UserGroup`  

### description

The description of the group.

Readonly  

Return type: `String`  

### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### isAllUsersGroup

If the group is the All Users group, this property is `true`.

Readonly  

Return type: `Boolean`  

### isAutoJoin

If the auto-join option is enabled for the group, this property is `true`.

Readonly  

Return type: `Boolean`  

### name

The name of the group.

Readonly  

Return type: `String`  

### users

A list of users who are members of the group.

Readonly  

Return type: [`Set.<User>`](../set.md)  

### project

The project that the team belongs to.

Readonly  
Since: `2025.3`  

Return type: `Project`  

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

Searches for ProjectTeam entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<ProjectTeam>`](../set.md).

The set of ProjectTeam entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findByName

Finds a group by name.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the group to search for. |

#### Returns

Return type: `UserGroup`.

The specified user group, or null when a group with the specified name is not found.

### notifyAllUsers

Sends an email notification to all of the users who are members of the group.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String` | The subject line of the email notification. |
| `body` | `String` | The message text of the email notification. |

#### Examples

```javascript
issue.oldValue('permittedGroup').notifyAllUsers('Visibility has been changed',
  'The visibility group for the issue ' + issue.getId() +
  ' has been changed to ' + permittedGroup.name);
```
