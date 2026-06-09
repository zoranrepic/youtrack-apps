# Issue

Represents an issue in YouTrack.

Parent types: `BaseEntity`.  

## Contents

### Constructors
- [`Issue`](#new-issue)

### Properties
- [`becomesRemoved`](#becomesremoved)
- [`extensionProperties`](#extensionproperties)
- [`isNew`](#isnew)
- [`attachments`](#attachments)
- [`becomesReported`](#becomesreported)
- [`becomesResolved`](#becomesresolved)
- [`becomesUnresolved`](#becomesunresolved)
- [`ccUsers`](#ccusers)
- [`channel`](#channel)
- [`comments`](#comments)
- [`created`](#created)
- [`customerGroups`](#customergroups)
- [`description`](#description)
- [`draftId`](#draftid)
- [`duplicateRoot`](#duplicateroot)
- [`editedComments`](#editedcomments)
- [`editedWorkItems`](#editedworkitems)
- [`fields`](#fields)
- [`ganttCharts`](#ganttcharts)
- [`id`](#id)
- [`isReported`](#isreported)
- [`isResolved`](#isresolved)
- [`isStarred`](#isstarred)
- [`links`](#links)
- [`mentionedInIssueComments`](#mentionedinissuecomments)
- [`mentionedInIssues`](#mentionedinissues)
- [`numberInProject`](#numberinproject)
- [`permittedGroup`](#permittedgroup)
- [`permittedGroups`](#permittedgroups)
- [`permittedUsers`](#permittedusers)
- [`pinnedComments`](#pinnedcomments)
- [`project`](#project)
- [`pullRequests`](#pullrequests)
- [`reporter`](#reporter)
- [`resolved`](#resolved)
- [`summary`](#summary)
- [`tags`](#tags)
- [`unauthenticatedReporter`](#unauthenticatedreporter)
- [`updatedBy`](#updatedby)
- [`updated`](#updated)
- [`url`](#url)
- [`vcsChanges`](#vcschanges)
- [`voters`](#voters)
- [`votes`](#votes)
- [`watchers`](#watchers)
- [`workItems`](#workitems)

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
- [`addComment`](#addcomment)
- [`addTag`](#addtag)
- [`addWorkItem`](#addworkitem)
- [`afterMinutes`](#afterminutes)
- [`applyCommand`](#applycommand)
- [`clearAttachments`](#clearattachments)
- [`copy`](#copy)
- [`createDraft`](#createdraft)
- [`createSharedDraft`](#createshareddraft)
- [`findByExtensionProperties`](#findbyextensionproperties)
- [`findById`](#findbyid)
- [`hasTag`](#hastag)
- [`isVisibleTo`](#isvisibleto)
- [`pauseSLA`](#pausesla)
- [`removeTag`](#removetag)
- [`renderMarkup`](#rendermarkup)
- [`resumeSLA`](#resumesla)
- [`setDefaultFieldValues`](#setdefaultfieldvalues)
- [`tag`](#tag)
- [`untag`](#untag)

## Constructors

### new Issue

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `reporter` | `User`, `JsonForIssueConstructor` | Issue reporter. Alternatively, pass a JSON specified by JsonForIssueConstructor |
| `project (optional)` | `Project` | Project that the new issue is to belong to. |
| `summary (optional)` | `String` | Issue summary. |

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

The set of attachments that are attached to the issue.

Readonly  

Return type: [`Set.<IssueAttachment>`](../set.md)  

### becomesReported

If the issue becomes reported in the current transaction, this property is `true`.

Readonly  

Return type: `Boolean`  

#### Examples

```javascript
if (issue.fields.Subsystem !== null && issue.fields.Assignee === null &&
    (((issue.isChanged('Subsystem') || issue.isChanged('project') && issue.isReported) ||
        issue.becomesReported) {
    issue.fields.Assignee = issue.fields.Subsystem.owner
}
```

### becomesResolved

If the issue was previously unresolved and is assigned a state that is considered resolved in the current transaction, this property is `true`.

Readonly  

Return type: `Boolean`  

### becomesUnresolved

If the issue was previously resolved and is assigned a state that is considered unresolved in the current transaction, this property is `true`.

Readonly  

Return type: `Boolean`  

### ccUsers

The users added as CCs to the helpdesk ticket. The ticket reporter is excluded automatically. Up to 10 reporter-type users can be kept in CC; extra reporters are removed automatically.

Since: `2026.1`  

Return type: [`Set.<User>`](../set.md)  

### channel

The channel used by the reporter to create the ticket. Possible values are 'FeedbackForm' for online forms or 'MailboxChannel' for email.

Readonly  

Return type: `Channel`  

### comments

A list of comments for the issue.

Readonly  

Return type: [`Set.<IssueComment>`](../set.md)  

### created

The date when the issue was created.

Readonly  

Return type: `Number`  

### customerGroups

The customer groups this helpdesk ticket is shared with. Members of these groups can view the ticket and add public comments.

Readonly  
Since: `2026.2`  

Return type: [`Set.<NestedUserGroup>`](../set.md)  

### description

The text that is entered as the issue description.

Return type: `String`  

### draftId

Draft issue ID. Returns `null` if the issue is not a draft.

Readonly  
Since: `2025.3`  

Return type: `String`  

### duplicateRoot

The root issue in a tree of duplicates that are linked to the issue.
For example, if `issueA` duplicates `issueB` and `issueB` duplicates
`issueC`, then the value for the `issueA.duplicateRoot()` property is `issueC`.

Readonly  

Return type: `Issue`  

### editedComments

The set of comments that are edited in the current transaction.
Comments that are added and removed are not considered to be edited.
Instead, these are represented by the `issue.comments.added` and `issue.comments.removed` properties.

Readonly  

Return type: [`Set.<IssueComment>`](../set.md)  

### editedWorkItems

The set of work items that are edited in the current transaction.
Work items that are added and removed are not considered to be edited.
Instead, these are represented by the `issue.workItems.added` and
`issue.workItems.removed` properties.

Readonly  
Since: `2017.4.37824`  

Return type: [`Set.<IssueWorkItem>`](../set.md)  

### fields

The custom fields that are used in an issue. This is the collection of issue attributes like
`Assignee`, `State`, and `Priority` that are defined in the Custom Fields section of the administrative interface and
can be attached to each project independently.

Issue attributes like `reporter`, `numberInProject`, and `project` are accessed directly.

Return type: `Fields`  

#### Examples

```javascript
if (issue.fields.becomes(ctx.Priority, ctx.Priority.Critical) {
  issue.fields.Assignee = issue.project.leader;
}
```

### ganttCharts

The collection of Gantt charts that this issue has been added to.

Readonly  
Since: `2022.1`  

Return type: [`Set.<Gantt>`](../set.md)  

### id

The issue ID.

Readonly  

Return type: `String`  

#### Examples

```javascript
user.notify('Issue is overdue', 'Please, look at the issue: ' + issue.id);
```

### isReported

If the issue is already reported or becomes reported in the current transaction, this property is `true`. To apply changes to an issue draft, use `!issue.isReported`.

Readonly  

Return type: `Boolean`  

#### Examples

```javascript
issue.links['depends on'].forEach(function(dep) {
  if (dep.isReported) {
    assert(dep.State.resolved, 'The issue has unresolved dependencies and thus cannot be set Fixed!');
  }
});
```

### isResolved

If the issue is currently assigned a state that is considered resolved, this property is `true`.

Readonly  

Return type: `Boolean`  

### isStarred

If the current user has added the 'Star' tag to watch the issue, this property is `true`.

Readonly  

Return type: `Boolean`  

### links

Issue links (e.g. `relates to`, `parent for`, etc.). Each link is a
[Set](../set.md) of Issue objects.

Return type: `Object`  

#### Examples

```javascript
if (issue.links['parent for'].added.isNotEmpty()) {
  issue.links['parent for'].added.forEach(function(subtask) {
    subtask.fields.Priority = issue.fields.Priority;
  });
}
```

### mentionedInIssueComments

The set of issue comments where this issue is mentioned.

Readonly  

Return type: [`Set.<IssueComment>`](../set.md)  

### mentionedInIssues

The set of issues where this issue is mentioned.

Readonly  

Return type: [`Set.<Issue>`](../set.md)  

### numberInProject

The issue number in the project.

Readonly  

Return type: `Number`  

### permittedGroup

The user group for which the issue is visible. If the property contains a null value, the issue is visible to the All Users group.

Return type: `UserGroup`  

### permittedGroups

The groups for which the issue is visible when the visibility is restricted to multiple groups.

Return type: [`Set.<UserGroup>`](../set.md)  

### permittedUsers

The list of users for whom the issue is visible.

Return type: [`Set.<User>`](../set.md)  

### pinnedComments

The set of comments that are pinned in the issue.

Readonly  
Since: `2024.1`  

Return type: [`Set.<IssueComment>`](../set.md)  

### project

The project to which the issue is assigned.

Return type: `Project`  

### pullRequests

The list of pull requests that are associated with the issue.

Readonly  
Since: `2020.3`  

Return type: [`Set.<PullRequest>`](../set.md)  

### reporter

The user who reported (created) the issue.

Readonly  

Return type: `User`  

#### Examples

```javascript
issue.fields.Assignee = issue.reporter;
```

### resolved

The date and time when the issue was assigned a state that is considered to be resolved.

Readonly  

Return type: `Number`  

### summary

The text that is entered as the issue summary.

Return type: `String`  

### tags

The list of tags that are attached to an issue.

Return type: [`Set.<Tag>`](../set.md)  

### unauthenticatedReporter

When true, the ticket was created by a reporter who was not logged in to YouTrack when they submitted the support request.

Readonly  

Return type: `Boolean`  

### updatedBy

The user who last updated the issue.

Readonly  

Return type: `User`  

### updated

The date when the issue was last updated.

Readonly  

Return type: `Number`  

### url

The absolute URL that points to the issue.

Readonly  

Return type: `String`  

#### Examples

```javascript
user.notify('Issue is overdue', 'Please, look at the issue: ' + issue.url);
```

### vcsChanges

The list of commits that are associated with the issue.

Readonly  
Since: `2018.1.38923`  

Return type: [`Set.<VcsChange>`](../set.md)  

### voters

Users who voted for the issue.

Readonly  
Since: `2020.5`  

Return type: [`Set.<User>`](../set.md)  

### votes

The number of votes for an issue. For vote-related methods, see User.canVoteIssue, User.voteIssue, User.canUnvoteIssue, and User.unvoteIssue.

Readonly  

Return type: `Number`  

### watchers

Returns the watchers of the issue.

Readonly  
Since: `2025.3`  

Return type: [`Set.<User>`](../set.md)  

### workItems

The set of work items that have been added to the issue.

Readonly  

Return type: [`Set.<IssueWorkItem>`](../set.md)  

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

Attaches a file to the issue.
Makes `issue.attachments.isChanged` return `true` for the current transaction.

Since: `2019.2.53994`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `content` | `InputStream`, `String`, `JsonForIssueAddAttachment` | The content of the file in binary form or as a base64 data URI. Base64 content must use the `data:[MIME type];base64,[content]` syntax. Alternatively, pass a JSON specified by JsonForIssueAddAttachment |
| `name (optional)` | `String` | The name of the file. |
| `charset (optional)` | `String` | The charset of the file. Only applicable to text files. |
| `mimeType (optional)` | `String` | The MIME type of the file. |

#### Returns

Return type: `IssueAttachment`.

The attachment that is added to the issue.

### addComment

Adds a comment to the issue.
Makes `issue.comments.isChanged` return `true` for the current transaction.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String`, `JsonForIssueAddComment` | The text to add to the issue as a comment. Alternatively, pass a JSON specified by JsonForIssueAddComment |
| `author (optional)` | `User` | The author of the comment. |

#### Returns

Return type: `IssueComment`.

A newly created comment.

### addTag

Adds a tag with the specified name to an issue. YouTrack adds the first matching tag that is visible to the current user.
If a match is not found, a new private tag is created for the current user.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to add to the issue. |

#### Returns

Return type: `Tag`.

The tag that has been added to the issue.

### addWorkItem

Adds a work item to the issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `description` | `String`, `JsonForIssueAddWorkItem` | The description of the work item. Alternatively, pass a JSON specified by JsonForIssueAddWorkItem |
| `date (optional)` | `Number` | The date that is assigned to the work item. |
| `author (optional)` | `User` | The user who performed the work. |
| `duration (optional)` | `Number` | The work duration in minutes. |
| `type (optional)` | `WorkItemType` | The work item type. |

#### Returns

Return type: `IssueWorkItem`.

The new work item.

### afterMinutes

Adds the specified number of minutes to a specified starting point in time.

Since: `2023.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `initialTime` | `Number` | A timestamp for the starting point in time. YouTrack adds the specified number of minutes to this point. |
| `minutes` | `Number` | The number of minutes to add to the starting point. |
| `calendar` | `Calendar` | The SLA settings for the business hours that should be considered when adding minutes to the starting point. If the result falls outside the business hours after adding specified minutes, the extra minutes get automatically transferred to the next business day. |
| `considerPauses` | `Boolean` | A switcher that determines whether to consider the effects of the 'pauseSLA' and 'resumeSLA' methods when adding specified minutes to the starting point. |

#### Returns

Return type: `Number`.

A timestamp after adding the specified number of minutes.

### applyCommand

Applies a command to the issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `command` | `String` | The command that is applied to the issue. |
| `runAs` | `User` | Specifies the user by which the command is applied. If this parameter is not set, the command is applied on behalf of the current user. |

### clearAttachments

Removes all of the attachments from the issue.

### copy

Creates a copy of the issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project (optional)` | `Project` | Project to create new issue in. Available since 2018.1.40575. |

#### Returns

Return type: `Issue`.

The copy of the original issue.

### createDraft

Creates a new issue draft.

Since: `2025.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project` | `Project` | Project that the new issue draft is to belong to. |
| `reporter (optional)` | `User` | Issue draft reporter. |

#### Returns

Return type: `Issue`.

Newly created issue draft.

### createSharedDraft

Creates a new shared issue draft.

Since: `2025.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `project` | `Project` | Project that the new issue draft is to belong to. |

#### Returns

Return type: `Issue`.

Newly created issue draft.

### findByExtensionProperties

Searches for Issue entities with extension properties that match the specified query.

Since: `2024.3.43260`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `extensionPropertiesQuery` | `Object` | The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values. |

#### Returns

Return type: [`Set.<Issue>`](../set.md).

The set of Issue entities that contain the specified extension properties.

#### Examples

```javascript
{
   property1: "value1",
   property2: "value2"
}
```

### findById

Finds an issue by its visible ID.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `String` | The issue ID. |

#### Returns

Return type: `Issue`.

The issue that is assigned the specified ID.

#### Examples

```javascript
var myIssue = entities.Issue.findById("NP-15971");
```

### hasTag

Checks whether the specified tag is attached to an issue.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tagName` | `String` | The name of the tag to check for the issue. |
| `ignoreVisibilitySettings (optional)` | `Boolean` | When `true`, checks all matching tags without regard to their visibility settings. When `false` (default), checks only matching tags that are visible to the current user. |

#### Returns

Return type: `Boolean`.

If the specified tag is attached to the issue, returns `true`.

### isVisibleTo

Checks whether the issue is accessible by specified user.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `user` | `User` | The user to check. |

#### Returns

Return type: `Boolean`.

If the issue is accessible for the user, returns 'true'.

### pauseSLA

Pauses the timers for the current SLA applied to the issue.

Since: `2023.1`  

### removeTag

Removes a tag with the specified name from an issue. If the specified tag is not attached to the issue, nothing happens.
This method first searches through tags owned by the current user, then through all other visible tags.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | `String` | The name of the tag to remove from the issue. |

#### Returns

Return type: `Tag`.

The tag that has been removed from the issue.

### renderMarkup

Converts text in markdown to HTML. Use this method to send "pretty" notifications.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | `String` | The string of text to convert to HTML. |

#### Returns

Return type: `String`.

Rendered markdown

#### Examples

```javascript
issue.Assignee.notify('Comment added:', issue.renderMarkup(comment.text));
```

### resumeSLA

Resumes the timers for the current SLA applied to the issue.

Since: `2023.1`  

### setDefaultFieldValues

Sets the default custom field values for the issue. Applies only for empty fields.

Since: `2025.3`  

### tag

Applies the tag to the issue.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tag` | `Tag` | The tag object. |

### untag

Removes the tag from the issue.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `tag` | `Tag` | The tag object. |
