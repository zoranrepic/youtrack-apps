# Fields

Represents the custom fields that are used in an issue.
The actual set of custom fields that are used for each issue is configured on a per-project basis.
The properties shown here correspond with the default custom fields in YouTrack.
Additional custom fields that have been attached to a project are also available.

Type: `Object`  

## Contents

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`oldValue`](#oldvalue)
- [`required`](#required)

## Methods

### becomes

Checks whether the value for a custom field is set to an expected value in the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The field to check. |
| `expected` | `Object` | The expected value. |

#### Returns

Return type: `boolean`.

If the field is set to the expected value, returns `true`.

### canBeReadBy

Checks whether a user has permission to read the custom field.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The custom field to check for read access. |
| `user` | `User` | The user for whom the permission to read the custom field is checked. |

#### Returns

Return type: `boolean`.

If the user can read the field, returns `true`.

### canBeWrittenBy

Checks whether a user has permission to update the custom field.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The custom field to check for update access. |
| `user` | `User` | The user for whom the permission to update the custom field is checked. |

#### Returns

Return type: `boolean`.

If the user can update the field, returns `true`.

### isChanged

Checks whether the custom field is changed in the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The name of the custom field (for example, 'State') or a reference to the field that is checked. |

#### Returns

Return type: `boolean`.

If the value of the field is changed in the current transaction, returns `true`.

### oldValue

Returns the previous value of a single-valued custom field before an update was applied. If the field is not changed
in the transaction, returns null.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `field` | `string`, `ProjectCustomField` | The name of the custom field (for example, 'State') or a reference to the field for which the previous value is returned. |

#### Returns

Return type: `Object`.

If the custom field is changed in the current transaction, the previous value of the field. Otherwise, the current value of the field.

### required

Asserts that a value is set for a custom field.
If a value for the required field is not set, the specified message is displayed in the user interface.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `fieldName` | `string` | The name of the custom field to check. |
| `message` | `string` | The message that is displayed to the user that describes the field requirement. |
