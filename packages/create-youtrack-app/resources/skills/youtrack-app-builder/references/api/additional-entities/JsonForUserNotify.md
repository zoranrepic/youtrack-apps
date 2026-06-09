# JsonForUserNotify

Type: `object`  

## Contents

### Properties
- `subject`
- `body`
- `ignoreNotifyOnOwnChangesSetting`
- `project`

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `subject` | `String` | The subject line of the email notification. |
| `body` | `String` | The message text of the email notification. |
| `ignoreNotifyOnOwnChangesSetting (optional)` | `Boolean` | If `false`, the message is not sent when changes are performed on behalf of the current user. Otherwise, the message is sent anyway. |
| `project (optional)` | `Project` | When set, the email address that is used as the 'From' address for the specified project is used to send the message. |
