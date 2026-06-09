# BaseArticle

The base class for article.

Since: `2021.4.23500`  

Parent types: `BaseEntity`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`attachments`](#attachments)
- [`author`](#author)
- [`content`](#content)
- [`isStarred`](#isstarred)
- [`originalArticle`](#originalarticle)
- [`summary`](#summary)
- [`tags`](#tags)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`addTag`](#addtag)
- [`hasTag`](#hastag)
- [`removeTag`](#removetag)

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

The set of attachments that are attached to the article.

Readonly  

Return type: [`Set.<BaseArticleAttachment>`](../set.md)  

### author

The user who created the article.

Readonly  

Return type: `User`  

### content

The text that is entered as the article content.

Return type: `String`  

### isStarred

If the current user has added the 'Star' tag to watch the article, this property is `true`.

Readonly  
Since: `2023.1`  

Return type: `Boolean`  

### originalArticle

The article from which the current article draft was created, or `null` if the current article is not a draft.

Readonly  
Since: `2026.1`  

Return type: `Article`  

### summary

The article title.

Return type: `String`  

### tags

The list of tags that are attached to the article.

Since: `2023.1`  

Return type: [`Set.<Tag>`](../set.md)  

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

### addTag

Adds a tag with the specified name to an article. YouTrack adds the first matching tag that is visible to the current user.
If a match is not found, a new private tag is created for the current user.

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to add to the article. |

#### Returns

Return type: `Tag`.

The tag that has been added to the article.

#### Examples

```javascript
article.addTag('review');
```

### hasTag

Checks whether the specified tag is attached to the article.

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tagName` | `String` | The name of the tag to check for the article. |

#### Returns

Return type: `Boolean`.

If the specified tag is attached to the article, returns `true`.

### removeTag

Removes a tag with the specified name from an article. If the specified tag is not attached to the article, nothing happens.
This method first searches through tags owned by the current user, then through all other visible tags.

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to remove from the article. |

#### Returns

Return type: `Tag`.

The tag that has been removed from the article.

#### Examples

```javascript
article.removeTag('waiting for review');
```
