# User

Represents a user account in YouTrack.

Parent types: `BaseEntity`.  

## Contents

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`attributes`](#attributes)
- [`avatarUrl`](#avatarurl)
- [`current`](#current)
- [`email`](#email)
- [`fieldType`](#fieldtype)
- [`firstDayOfWeeks`](#firstdayofweeks)
- [`fullName`](#fullname)
- [`groups`](#groups)
- [`isBanned`](#isbanned)
- [`isEmailVerified`](#isemailverified)
- [`isOnline`](#isonline)
- [`isSystem`](#issystem)
- [`language`](#language)
- [`login`](#login)
- [`pinnedSavedQueries`](#pinnedsavedqueries)
- [`registered`](#registered)
- [`ringId`](#ringid)
- [`teams`](#teams)
- [`timeZoneId`](#timezoneid)
- [`type`](#type)
- [`visibleName`](#visiblename)

### Methods
- [`becomes`](#becomes)
- [`canBeReadBy`](#canbereadby)
- [`canBeWrittenBy`](#canbewrittenby)
- [`isChanged`](#ischanged)
- [`is`](#is)
- [`oldValue`](#oldvalue)
- [`required`](#required)
- [`was`](#was)
- [`canLinkIssue`](#canlinkissue)
- [`canUnvoteIssue`](#canunvoteissue)
- [`canVoteIssue`](#canvoteissue)
- [`findByEmail`](#findbyemail)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findByLogin`](#findbylogin)
- [`findUniqueByEmail`](#finduniquebyemail)
- [`getSharedTag`](#getsharedtag)
- [`getTag`](#gettag)
- [`hasPermission`](#haspermission)
- [`hasRole`](#hasrole)
- [`isInGroup`](#isingroup)
- [`isVotedForIssue`](#isvotedforissue)
- [`isWatchingIssue`](#iswatchingissue)
- [`notify`](#notify)
- [`notifyOnCase`](#notifyoncase)
- [`sendMail`](#sendmail)
- [`unvoteIssue`](#unvoteissue)
- [`unwatchArticle`](#unwatcharticle)
- [`unwatchIssue`](#unwatchissue)
- [`voteIssue`](#voteissue)
- [`watchArticle`](#watcharticle)
- [`watchIssue`](#watchissue)

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

### attributes

Custom user attributes.

Readonly  
Since: `2021.1.7000`  

Return type: `UserAttributes`  

### avatarUrl

The absolute URL of the image that is used as the avatar for a user account. May point to an external service, like Gravatar.

Readonly  
Since: `2019.3`  

Return type: `String`  

### current

The current (logged in) user.

Readonly  

Return type: `User`  

### email

The email address of the user.

Readonly  

Return type: `String`  

### fieldType

Field type. Used when defining rule requirements.

Readonly  

Return type: `String`  

### firstDayOfWeeks

First day of week as set in the user's profile settings. 0 is for Sunday, 1 is for Monday, etc.

Readonly  
Since: `2019.1.50122`  

Return type: `Number`  

### fullName

The full name of the user as seen in their profile.

Readonly  

Return type: `String`  

### groups

The list of user's groups.

Readonly  
Since: `2025.3`  

Return type: [`Set.<NestedUserGroup>`](../set.md)  

### isBanned

If the user is currently banned, this property is `true`.

Readonly  

Return type: `Boolean`  

### isEmailVerified

Indicates whether the user has a verified email address in their profile.

Readonly  
Since: `2023.1`  

Return type: `Boolean`  

### isOnline

If the user has interacted with YouTrack in any way within the last five minutes.

Readonly  
Since: `2022.1`  

Return type: `Boolean`  

### isSystem

When `true`, the user functions as a system user. System users are user accounts utilized for running imports, integrations, and other automations.

Readonly  
Since: `2022.2`  

Return type: `Boolean`  

### language

The display language selected in the general settings of the user profile.

Readonly  
Since: `2022.1`  

Return type: `String`  

### login

The login of the user.

Readonly  

Return type: `String`  

### pinnedSavedQueries

Returns pinned by the user saved queries.

Readonly  
Since: `2025.3`  

Return type: [`Set.<SavedQuery>`](../set.md)  

### registered

The date when the user was registered.

Readonly  
Since: `2024.3`  

Return type: `Number`  

### ringId

ID of the user in Hub. You can use this ID for operations in Hub, and for matching users between YouTrack and Hub.

Readonly  
Since: `2020.6.3000`  

Return type: `String`  

### teams

The list of project teams that the user belongs to.

Readonly  
Since: `2025.3`  

Return type: [`Set.<ProjectTeam>`](../set.md)  

### timeZoneId

The ID of the local time zone selected in the general settings of the user profile.

Readonly  

Return type: `String`  

### type

The user type assigned to the user account for licensing purposes. Possible values include: `UserType.STANDARD_USER` (a standard user), `UserType.AGENT` (a helpdesk agent), and `UserType.REPORTER` (a helpdesk reporter).

Readonly  
Since: `2026.2`  

Return type: `UserType`  

### visibleName

The full name of the user or the login if the full name is not set.

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

### canLinkIssue

Checks whether the user is permitted to link the specified issue to any other issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to link. |

#### Returns

Return type: `Boolean`.

If the user can link the issue, returns `true`.

### canUnvoteIssue

Checks whether the user is able to remove their vote from the specified issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check. |

#### Returns

Return type: `Boolean`.

If the user can vote for the issue, returns `true`.

### canVoteIssue

Checks whether the user is able to vote for the specified issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check. |

#### Returns

Return type: `Boolean`.

If the user can vote for the issue, returns `true`.

### findByEmail

Finds users by email.

Since: `2018.2.41100`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `email` | `String` | The email to search for. |

#### Returns

Return type: [`Set.<User>`](../set.md).

Users with the specified email.

### findByExtensionProperties

Searches for User entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<User>`](../set.md).

The set of User entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findByLogin

Finds a user by login.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `login` | `String` | The login of the user account to search for. |

#### Returns

Return type: `User`.

The specified user, or null when a user with the specified login is not found.

### findUniqueByEmail

Finds a user by email.

Since: `2018.2.41100`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `email` | `String` | The email of the user account to search for. |

#### Returns

Return type: `User`.

The specified user, or null when a user with the specified email is not found or there are multiple users with the specified email.

### getSharedTag

Returns a tag with the specified name that is shared with but not owned by the user. If such a tag does not exist, a null value is returned.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag. |

#### Returns

Return type: `Tag`.

The tag.

### getTag

Returns a tag that is visible to the user.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag. |
| `createIfNotExists` | `Boolean` | If `true` and the specified tag does not exist or is not visible to the user and the user has permission to create tags, a new tag with the specified name is created. |

#### Returns

Return type: `Tag`.

The tag.

### hasPermission

Checks whether the user has the specified permission.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `permissionKey` | `String` | The permission key to check. For the complete list of available permission keys, see https://www.jetbrains.com/help/youtrack/devportal/app-permissions.html. |
| `project (optional)` | `Project` | The project to check for the specified permission assignment. If omitted, checks if the user has the global role. |

#### Returns

Return type: `Boolean`.

If the user has the permission, returns `true`.

### hasRole

Checks whether the user is granted the specified role in the specified project. When the project parameter is not specified, checks whether the user has the specified role in any project.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `roleName` | `String` | The name of the role to check for. |
| `project (optional)` | `Project` | The project to check for the specified role assignment. If omitted, checks whether the user has the specified role in any project. |

#### Returns

Return type: `Boolean`.

If the user is granted the specified role, returns `true`.

### isInGroup

Checks whether the user is a member of the specified group.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `groupName` | `String` | The name of the group to check for. |

#### Returns

Return type: `Boolean`.

If the user is a member of the specified group, returns `true`.

### isVotedForIssue

Check whether the user has voted for the specified issue.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check the vote is added. |

#### Returns

Return type: `Boolean`.

If the user has voted for the issue, returns `true`.

### isWatchingIssue

Checks whether the current user is added as a watcher for the specified issue.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to check for the watcher assignment. |

#### Returns

Return type: `Boolean`.

If the user is added as a watcher for the issue, returns `true`.

### notify

Sends an email notification to the email address that is set in the user profile.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String`, `JsonForUserNotify` | The subject line of the email notification. Alternatively, pass a JSON specified by JsonForUserNotify |
| `body (optional)` | `String` | The message text of the email notification. |
| `ignoreNotifyOnOwnChangesSetting (optional)` | `Boolean` | If `false`, the message is not sent when changes are performed on behalf of the current user. Otherwise, the message is sent anyway. |
| `project (optional)` | `Project` | When set, the email address that is used as the 'From' address for the specified project is used to send the message. |

### notifyOnCase

Sends a notification to all notification channels configured for the user.

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `caseName` | `string` | The name of the notification case as seen on the notification templates configuration page. |
| `parameters (optional)` | `Object` | A JSON object that provides required parameters for the notification to render. Particular parameters depend on the notification case. |
| `projectDocument (optional)` | `Issue`, `Article` | An issue or an article that this notification is about. The difference between providing it as a separately vs. passing it among other parameters is that in the former case the notification will be merged with other notifications on that issue/article. |

### sendMail

Sends an email notification to the email address that is set in the user profile. An alias for notify(subject, body, true).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String` | The subject line of the email notification. |
| `body` | `String` | The message text of the email notification. |

### unvoteIssue

Removes a vote on behalf of the user from the issue, if allowed.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue from which the vote is removed. |

### unwatchArticle

Removes the current user from the list of watchers for the article
(removes the `Star` tag).

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `article` | `BaseArticle` | The article from which the user is removed as a watcher. |

### unwatchIssue

Removes the current user from the list of watchers for the issue
(removes the `Star` tag).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue from which the user is removed as a watcher. |

### voteIssue

Adds a vote on behalf of the user to the issue, if allowed.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to which the vote is added. |

### watchArticle

Adds the current user to the article as a watcher (adds the `Star` tag).

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `article` | `BaseArticle` | The article to which the user is added as a watcher. |

### watchIssue

Adds the current user to the issue as a watcher (adds the `Star` tag).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `issue` | `Issue` | The issue to which the user is added as a watcher. |
