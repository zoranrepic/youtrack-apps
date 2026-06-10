# IssueComment

Represents a comment that is added to an issue.

Parent types: `BaseEntity`, `BaseComment`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`attachments`](#attachments)
- [`created`](#created)
- [`isPinned`](#ispinned)
- [`text`](#text)
- [`updated`](#updated)
- [`author`](#author)
- [`deleted`](#deleted)
- [`issue`](#issue)
- [`permittedGroup`](#permittedgroup)
- [`permittedGroups`](#permittedgroups)
- [`permittedUsers`](#permittedusers)
- [`updatedBy`](#updatedby)
- [`url`](#url)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`addAttachment`](#addattachment)
- [`delete`](#delete)
- [`findByExtensionProperties`](#findbyextensionproperties)
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

When `true`, the entity is created in the current transaction. Otherwise, `false`.

Readonly  
Since: `2018.2.42351`  

Return type: `Boolean`  

### attachments

The set of attachments that are attached to the comment.

Readonly  
Since: `2018.1.40030`  

Return type: [`Set.<IssueAttachment>`](../set.md)  

### created

Time the comment was created.

Readonly  

Return type: `Number`  

### isPinned

When `true`, the comment is pinned in the issue. Otherwise, `false`.

Since: `2024.1`  

Return type: `Boolean`  

### text

The text of the comment.

Return type: `String`  

### updated

Time the comment was last updated.

Readonly  

Return type: `Number`  

### author

The user who created the comment.

Readonly  

Return type: `User`  

### deleted

`true` in case the comment is displayed as removed.

Readonly  
Since: `2020.6.4500`  

Return type: `Boolean`  

### issue

The issue the comment belongs to.

Readonly  

Return type: `Issue`  

### permittedGroup

A group who's members are allowed to access the comment.

Return type: `UserGroup`  

### permittedGroups

Groups whose members are allowed to access the comment.

Return type: [`Set.<UserGroup>`](../set.md)  

### permittedUsers

Users who are allowed to access the comment.

Return type: [`Set.<User>`](../set.md)  

### updatedBy

The user who last updated the comment.

Readonly  

Return type: `User`  

### url

The absolute URL (permalink) that points to the comment.

Readonly  

Return type: `String`  

#### Examples

```javascript
user.notify('Somebody has written something', 'Have a look: ' + comment.url);
```

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

### addAttachment

Attaches a file to the issue comment.
Makes `issue.attachments.isChanged` return `true` for the current transaction.

Since: `2020.6.3400`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String`, `JsonForIssueCommentAddAttachment` | The content of the file in binary or base64 form. Alternatively, pass a JSON specified by JsonForIssueCommentAddAttachment |
| `name (optional)` | `String` | The name of the file. |
| `charset (optional)` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType (optional)` | `String` | The MIME type of the file. |

#### Returns

Return type: `IssueAttachment`.

The attachment that is added to the issue comment.

### delete

Logically deletes the comment. This means that the comment is marked as deleted, but remains in the database.
Users with sufficient permissions can restore the comment or delete the comment permanently from the user interface.
The option to delete comments permanently has not been implemented in this API.

Since: `2018.1.38923`  

### findByExtensionProperties

Searches for IssueComment entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<IssueComment>`](../set.md).

The set of IssueComment entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### isVisibleTo

Checks whether the specified user has access to view the comment.

Since: `2021.1.2300`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

#### Returns

Return type: `Boolean`.

When 'true', the specified user has access to view the comment. Otherwise, 'false'.
