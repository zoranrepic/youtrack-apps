# Project

Represents a YouTrack project.

Parent types: `BaseEntity`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`articles`](#articles)
- [`changesProcessors`](#changesprocessors)
- [`defaultVisibilityGroup`](#defaultvisibilitygroup)
- [`description`](#description)
- [`fields`](#fields)
- [`isArchived`](#isarchived)
- [`issues`](#issues)
- [`isTimeTrackingEnabled`](#istimetrackingenabled)
- [`key`](#key)
- [`leader`](#leader)
- [`name`](#name)
- [`notificationEmail`](#notificationemail)
- [`projectType`](#projecttype)
- [`sharedChangesProcessors`](#sharedchangesprocessors)
- [`shortName`](#shortname)
- [`team`](#team)
- [`workItemAttributes`](#workitemattributes)

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
- [`findByKey`](#findbykey)
- [`findByName`](#findbyname)
- [`findFieldByName`](#findfieldbyname)
- [`findWorkItemAttributeByName`](#findworkitemattributebyname)
- [`intervalToWorkingMinutes`](#intervaltoworkingminutes)
- [`isAgent`](#isagent)
- [`newDraft`](#newdraft)

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

### articles

A list of all articles that belong to the project.

Readonly  
Since: `2021.4.23500`  

Return type: [`Set.<Article>`](../set.md)  

### changesProcessors

The list of VCS change processors that are integrated with the project.

Readonly  
Since: `2020.3`  

Return type: [`Set.<ChangesProcessor>`](../set.md)  

### defaultVisibilityGroup

The group that is set automatically as the initial default for the Visible to group in new issues and articles in this project.

Readonly  
Since: `2026.2`  

Return type: `UserGroup`  

### description

The description of the project as shown on the project profile page.

Readonly  

Return type: `String`  

### fields

The set of custom fields that are available in the project.

Readonly  

Return type: [`Set.<ProjectCustomField>`](../set.md)  

### isArchived

If the project is currently archived, this property is `true`.

Readonly  

Return type: `Boolean`  

### issues

A list of all issues that belong to the project.

Readonly  

Return type: [`Set.<Issue>`](../set.md)  

### isTimeTrackingEnabled

If the time tracking feature is enabled in the project, this property is `true`.

Readonly  
Since: `2026.1`  

Return type: `Boolean`  

### key

The ID of the project. Use instead of project.shortName, which is deprecated.

Readonly  

Return type: `String`  

### leader

The user who is set as the project owner.

Readonly  

Return type: `User`  

### name

The name of the project.

Readonly  

Return type: `String`  

### notificationEmail

The email address that is used to send notifications for the project.
If a 'From' address is not set for the project, the default 'From' address for the YouTrack server is returned.

Readonly  

Return type: `String`  

#### Examples

```javascript
if (issue.becomesReported) {
  const lastRelatedEmails = issue.fields['Last message related emails'];
  lastRelatedEmails?.split(' ')?.forEach(function (email) {
    if (email?.equalsIgnoreCase(issue.project.notificationEmail)) {
      const allRelatedEmails = issue.fields['All related emails'];
      if (!allRelatedEmails) {
        issue.fields['All related emails'] = email;
      } else if (!(allRelatedEmails.split(' ').has(email))) {
        issue.fields['All related emails'] = allRelatedEmails + ' ' + email;
      }
    }
  });
  issue.fields['Last message related emails'] = null;
}
```

### projectType

Determines which basic features are available for use in a project. Possible values are 'standard' or 'helpdesk'.

Readonly  

Return type: `ProjectType`  

### sharedChangesProcessors

The list of VCS change processors that are shared with the project.

Readonly  
Since: `2025.3`  

Return type: [`Set.<ChangesProcessor>`](../set.md)  

### shortName

Readonly  

Return type: `String`  

### team

The project team. This UserGroup object contains the users and members of groups who are assigned to the project team.

Readonly  
Since: `2017.4.38235`  

Return type: `UserGroup`  

### workItemAttributes

Work item attributes configured for the project.

Readonly  
Since: `2024.2`  

Return type: [`Set.<WorkItemProjectAttribute>`](../set.md)  

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

Searches for Project entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<Project>`](../set.md).

The set of Project entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findByKey

Finds a project by ID.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `key` | `String` | The ID of the project to search for. |

#### Returns

Return type: `Project`.

The project, or null when there are no projects with the specified ID.

### findByName

Finds a project by name.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the project to search for. |

#### Returns

Return type: `Project`.

The project, or null when there are no projects with the specified name.

### findFieldByName

Returns the custom field in the project with the specified name.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the custom field. |

#### Returns

Return type: `ProjectCustomField`.

The custom field with the specified name.

### findWorkItemAttributeByName

Returns work item attribute with the given name or null if it does not exist.

Since: `2024.2`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | Name of the attribute to find by |

#### Returns

Return type: `WorkItemProjectAttribute`.

Work item attribute with the given name or null if it does not exist.

### intervalToWorkingMinutes

Gets the number of minutes that occurred during working hours in a specified interval.
For example, if the interval is two days and the number of working hours in a day is set to 8, the result is 2 * 8 * 60 = 960

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `start` | `Number` | Start of the interval. |
| `end` | `Number` | End of the interval. |

#### Returns

Return type: `Number`.

The number of minutes that occurred during working hours in the specified interval.

### isAgent

Checks if the specified user is an agent in the project.

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

#### Returns

Return type: `Boolean`.

If the specified user is added to agents in the project, returns 'true'.

### newDraft

Creates a new issue draft.

Since: `2021.4`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `reporter (optional)` | `User` | Issue draft reporter. |

#### Returns

Return type: `Issue`.

Newly created issue draft.
