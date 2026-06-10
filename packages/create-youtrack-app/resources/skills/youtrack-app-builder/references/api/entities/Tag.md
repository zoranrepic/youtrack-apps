# Tag

Represents a tag.

Parent types: `BaseEntity`, `WatchFolder`.  

## Contents

### Constructors
- [`Tag`](#new-tag)

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
- [`permittedTagUserGroups`](#permittedtagusergroups)
- [`permittedTagUsers`](#permittedtagusers)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`canBeUsedForArticle`](#canbeusedforarticle)
- [`canBeUsedForIssue`](#canbeusedforissue)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByName`](#findbyname)
- [`findByOwner`](#findbyowner)
- [`findTagByName`](#findtagbyname)

## Constructors

### new Tag

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag. |
| `owner (optional)` | `User` | The owner of the tag. Defaults to the current user. |

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

The name of the tag.

Readonly  

Return type: `String`  

### owner

The user who created the tag.

Readonly  

Return type: `User`  

### permittedTagUserGroups

The groups of users who can apply the tag.

Readonly  
Since: `2022.1`  

Return type: [`Set.<UserGroup>`](../set.md)  

### permittedTagUsers

The users who can apply the tag.

Readonly  
Since: `2022.1`  

Return type: [`Set.<User>`](../set.md)  

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

### canBeUsedForArticle

Checks whether a user has permission to use the tag in the specified article.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `article` | `BaseArticle` | The article to tag. |
| `user` | `User` | The user to check. Defaults to the current user. |

#### Returns

Return type: `Boolean`.

If the user can tag the article, returns `true`.

### canBeUsedForIssue

Checks whether a user has permission to use the tag in the specified issue.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to tag. |
| `user` | `User` | The user to check. Defaults to the current user. |

#### Returns

Return type: `Boolean`.

If the user can tag the issue, returns `true`.

### findByExtensionProperties

Searches for Tag entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<Tag>`](../set.md).

The set of Tag entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findByName

Finds a set of tags with the specified name. The tags that were created by the current user are returned at the top of the list.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to search for. |
| `ignoreVisibilitySettings (optional)` | `Boolean` | When `true`, returns all matching tags without regard to their visibility settings. When `false` (default), returns only matching tags that are visible to the current user. |

#### Returns

Return type: [`Set.<Tag>`](../set.md).

The set of tags that match the specified name.

### findByOwner

Finds tags owned by a specified user without considering the visibility settings for the tags.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `owner` | `User` | The owner of the tags to find. |

#### Returns

Return type: [`Set.<Tag>`](../set.md).

The set of tags with the specified owner.

### findTagByName

Finds the most relevant tag with the specified name that is visible to the current user.
"Star" tag is excluded from the results.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to search for. |

#### Returns

Return type: `Tag`.

The most relevant tag.
