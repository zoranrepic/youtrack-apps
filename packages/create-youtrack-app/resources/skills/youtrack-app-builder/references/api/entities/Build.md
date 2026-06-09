# Build

Represents a value that is stored in a custom field that stores a build type.

Parent types: `BaseEntity`, `Field`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`backgroundColor`](#backgroundcolor)
- [`colorIndex`](#colorindex)
- [`dateTimeType`](#datetimetype)
- [`dateType`](#datetype)
- [`description`](#description)
- [`floatType`](#floattype)
- [`foregroundColor`](#foregroundcolor)
- [`integerType`](#integertype)
- [`isArchived`](#isarchived)
- [`name`](#name)
- [`ordinal`](#ordinal)
- [`periodType`](#periodtype)
- [`presentation`](#presentation)
- [`stringType`](#stringtype)
- [`textType`](#texttype)
- [`assembleDate`](#assembledate)
- [`fieldType`](#fieldtype)

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

### backgroundColor

The background color of the value in the custom field as it is displayed in YouTrack.

Readonly  

Return type: `String`  

### colorIndex

The index value of the color that is assigned to the value in the custom field.

Readonly  

Return type: `Number`  

### dateTimeType

Date and time field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### dateType

Date field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### description

The description of the value as visible in the administrative UI for custom fields.

Readonly  

Return type: `String`  

### floatType

Float field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### foregroundColor

The foreground color of the value in the custom field as it is displayed in YouTrack.

Readonly  

Return type: `String`  

### integerType

Integer field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### isArchived

If the value is archived, this property is `true`.

Readonly  

Return type: `Boolean`  

### name

The name of the value, which is also stored as the value in the custom field.

Readonly  

Return type: `String`  

### ordinal

The position of the value in the set of values for the custom field.

Readonly  

Return type: `Number`  

### periodType

Period field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### presentation

String representation of the value.

Readonly  

Return type: `String`  

### stringType

String field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### textType

Text field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### assembleDate

The date and time when the build was assembled.

Readonly  

Return type: `Number`  

### fieldType

Field type. Used when defining rule requirements.

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

Searches for Build entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<Build>`](../set.md).

The set of Build entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```
