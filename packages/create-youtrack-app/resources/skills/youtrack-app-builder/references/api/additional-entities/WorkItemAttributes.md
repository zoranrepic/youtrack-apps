# WorkItemAttributes

Represents the collection of custom attributes that have been declared for work items on a project level. To retrieve a value that is stored in an attribute for a referenced work item, use the attribute name as the key.

Type: `Object`  

## Examples

```javascript
issue.workItems.first().attributes['Attribute name'] = 'Attribute value';
```

```javascript
const attributeValue = issue.project.findWorkItemAttributeByName('Attrib').findValueByName('Value 3');
const newWorkItem = issue.addWorkItem({
  description: 'Hard work',
  date: Date.now(),
  author: ctx.currentUser,
  duration: 60,
  type: entities.WorkItemType.findByProject(issue.project).first()
});
newWorkItem.attributes.Attrib = attributeValue;
```
