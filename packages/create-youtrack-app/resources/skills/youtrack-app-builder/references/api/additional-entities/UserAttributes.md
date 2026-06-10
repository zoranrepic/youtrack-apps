# UserAttributes

Represents the collection of custom attributes that have been added to user profiles. To retrieve a value that is stored in the profile for a referenced user, use the attribute name as the key.
The entire object is read-only.

Type: `Object`  

## Examples

```javascript
issue.fields.addComment('To contact me outside of normal office hours, call ' + ctx.currentUser.attributes['phone']);
```
