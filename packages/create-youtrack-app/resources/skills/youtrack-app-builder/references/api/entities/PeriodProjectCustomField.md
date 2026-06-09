# PeriodProjectCustomField

Represents a custom field in a project that stores a value as a period type.
We use org.joda.time.Period as a base class for period values.
While you can read the class documentation at
http://joda-time.sourceforge.net/apidocs/org/joda/time/Period.html,
please note that we support only class members which use the Period class and
primitive types like String and int.

Parent types: `BaseEntity`, `ProjectCustomField`, `SimpleProjectCustomField`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`localizedName`](#localizedname)
- [`name`](#name)
- [`nullValueText`](#nullvaluetext)
- [`typeName`](#typename)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`becomesInvisibleInIssue`](#becomesinvisibleinissue)
- [`becomesVisibleInIssue`](#becomesvisibleinissue)
- [`getBackgroundColor`](#getbackgroundcolor)
- [`getForegroundColor`](#getforegroundcolor)
- [`getValuePresentation`](#getvaluepresentation)
- [`isVisibleInIssue`](#isvisibleinissue)
- [`findByExtensionProperties`](#findbyextensionproperties)

## Examples

```javascript
// to convert period to minutes (or other units) use get* methods:
// This example assumes a five-day work week and an eight-hour work day.
// Adjust the conversion if your YouTrack instance uses different time tracking settings.
var period = issue.fields.Estimation;
var minutes = !period ? 0 : (period.getMinutes() +
                             60 * (period.getHours() +
                                   8 * (period.getDays() +
                                        5 * period.getWeeks())));
// To create a Period instance, use the toPeriod function from the date-time module:
issue.fields.Estimation = dateTime.toPeriod(3 * 3600 * 1000); // 3h in ms
issue.fields.Estimation = dateTime.toPeriod('3h'); // short form
issue.fields.Estimation = dateTime.toPeriod('2w4d3h15m'); // full form
```

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

### localizedName

The localized name of the field.

Readonly  

Return type: `String`  

### name

The name of the field.

Readonly  

Return type: `String`  

### nullValueText

The text that is displayed for this field when it is empty.

Readonly  

Return type: `String`  

### typeName

The data type assigned to values stored in the custom field.

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

### becomesInvisibleInIssue

Checks if the changes that are applied in the current transaction remove the condition to show the custom field.

Since: `2018.2.42312`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition for showing the field is checked. |

#### Returns

Return type: `Boolean`.

When `true`, the condition for showing the field is removed in the current transaction.

### becomesVisibleInIssue

Checks if the changes that are applied in the current transaction satisfy the condition to show the custom field.

Since: `2018.2.42312`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition for showing the field is checked. |

#### Returns

Return type: `Boolean`.

When `true`, the condition for showing the field is met in the current transaction.

### getBackgroundColor

Returns the background color that is used for this field value in the specified issue.
Can return `null`, `"white"`, or a hex color presentation.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the background color is returned. |

#### Returns

Return type: `String`.

The background color that is used for this field value in the specified issue.

### getForegroundColor

Returns the foreground color that is used for this field value in the specified issue.
Can return `null`, `"white"`, or a hex color presentation.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the foreground color is returned. |

#### Returns

Return type: `String`.

The foreground color that is used for this field value in the specified issue.

### getValuePresentation

Returns the string presentation of the value that is stored in this field in the specified issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the value presentation is returned. |

#### Returns

Return type: `String`.

The string presentation of the value.

### isVisibleInIssue

Checks if a field is visible in the issue.

Since: `2018.2.42312`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue for which the condition for showing the field is checked. |

#### Returns

Return type: `Boolean`.

When `true`, the condition for showing the custom field in the issue has been met. It can also mean that the field is not shown on a conditional basis and is always visible.

#### Examples

```javascript
// The following example checks the issue to see whether a conditional field with the name "Related Activity"
// is currently visible, meaning that the conditions for showing the field have been met.
// If so, the value for the field is set to "Attendance"

action: function (ctx) {
  if (ctx.RelatedActivity.isVisibleInIssue(ctx.issue)) {
    ctx.issue.fields.RelatedActivity.add(ctx.RelatedActivity.Attendance);
  }
},
requirements: {
  RelatedActivity: {
    name: 'Related Activity',
    type: entities.EnumField.fieldType,
    multi: true,
    Attendance: {}
  }
}
```

### findByExtensionProperties

Searches for PeriodProjectCustomField entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<PeriodProjectCustomField>`](../set.md).

The set of PeriodProjectCustomField entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```
