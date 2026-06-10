# Agile

Represents an agile board and the set of sprints that belong to the board.

Parent types: `BaseEntity`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`author`](#author)
- [`currentSprint`](#currentsprint)
- [`name`](#name)
- [`sprints`](#sprints)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`addIssue`](#addissue)
- [`containsIssue`](#containsissue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`findSprintByName`](#findsprintbyname)
- [`getAddedSprints`](#getaddedsprints)
- [`getIssueSprints`](#getissuesprints)
- [`getRemovedSprints`](#getremovedsprints)
- [`getSprints`](#getsprints)
- [`isAdded`](#isadded)
- [`isRemoved`](#isremoved)
- [`removeIssue`](#removeissue)

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

### author

The user who created the board.

Readonly  

Return type: `User`  

### currentSprint

The sprint that is considered to be in active development at the current moment.

Readonly  
Since: `2023.1`  

Return type: `Sprint`  

### name

The name of the agile board.

Readonly  

Return type: `String`  

### sprints

The set of sprints that are associated with the board.

Readonly  

Return type: [`Set.<Sprint>`](../set.md)  

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

### addIssue

Adds the issue to the current sprint of the board.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue that is added to the board. |

### containsIssue

Checks whether the issue belongs to the board.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

#### Returns

Return type: `Boolean`.

If the issue belongs to the board, returns ``true``.

### findByExtensionProperties

Searches for Agile entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<Agile>`](../set.md).

The set of Agile entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findByName

Returns a set of agile boards that have the specified name.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of an agile board. |

#### Returns

Return type: [`Set.<Agile>`](../set.md).

A set of agile boards that are assigned the specified name.

### findSprintByName

Finds a specific sprint by name.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the sprint. |

#### Returns

Return type: `Sprint`.

If a sprint with the specified name is found, the corresponding Sprint object is returned. Otherwise, the return value is null.

### getAddedSprints

Gets all sprints of this board where the issue is added during the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which added sprints are returned. |

#### Returns

Return type: [`Set.<Sprint>`](../set.md).

A set of sprints where the issue is added.

### getIssueSprints

Returns the sprints that an issue is assigned to on an agile board.

Since: `2018.1.39547`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which you want to get the sprints that it is assigned to. |

#### Returns

Return type: [`Set.<Sprint>`](../set.md).

The sprints that the issue is assigned to on the agile board.

### getRemovedSprints

Gets all sprints of this board from which the issue is removed during the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which removed sprints are returned. |

#### Returns

Return type: [`Set.<Sprint>`](../set.md).

A set of sprints from which the issue is removed.

### getSprints

Gets all sprints of this board where the issue belongs.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which sprints are returned. |

#### Returns

Return type: [`Set.<Sprint>`](../set.md).

A set of sprints where the issue belongs.

### isAdded

Checks whether the issue gets added to the board in the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

#### Returns

Return type: `Boolean`.

If the issue gets added to the board, returns ``true``.

### isRemoved

Checks whether the issue gets removed from the board in the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition is checked. |

#### Returns

Return type: `Boolean`.

If the issue gets removed from the board, returns ``true``.

### removeIssue

Removes the issue from all sprints of this board where it belongs.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue that is removed from the board. |
