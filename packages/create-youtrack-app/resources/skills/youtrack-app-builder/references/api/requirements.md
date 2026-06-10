# Requirements


The `Requirements` object serves two purposes.
 First, it functions as a safety net. It specifies the set of entities that must exist for a rule to work as expected.
 Whenever one or more rule requirements are not met, corresponding errors are shown in the workflow administration UI.
 The rule is not executed until all of the problems are fixed.

 Second, it functions as a reference.
 Each entity in the requirements is plugged into the `context` object, so you can reference entities from inside your
 context-dependent functions (like an `action` function).

 There are two types of requirements: project-wide and system-wide.
 Project-wide requirements contain a list of custom fields that must be attached
 to each project that uses the rule as well as the required values from the sets of values for each custom field.
 System-wide requirements contain a list of other entities that must be available in YouTrack.
 This includes users, groups, projects, issues, tags, saved searches, and issue link types.

Type: `Object.<string, Requirement>`  

## Contents

- [Requirement](#requirement)

### Examples

```javascript
requirements: {
   P: {
     type: entities.EnumField.fieldType,
     name: 'Priority',
     M: { name: 'Major' },
     Normal: {}
   },

   ImportantPerson: {
     type: entities.User,
     login: 'superadmin'
   },
   OurTeam: {
     type: entities.UserGroup,
     name: 'integration-team'
   },
   Int: {
     type: entities.Project,
     name: 'Integration'
   },
   Ref: {
     type: entities.Issue,
     id: 'INT-483'
   },
   ToBeReleased: {
     type: entities.Tag,
     name: 'To be released'
   },
   Untested: {
     type: entities.SavedQuery,
     name: 'Not tested yet'
   },
   Depend: {
     type: entities.IssueLinkPrototype,
     outward: 'is required for',
     inward: 'depends on'
   }
 }
```

## Requirement

A single element in a set of Requirements

Type: `Object`  

### Properties

| Name | Type | Description |
| --- | --- | --- |
| `name (optional)` | `string` | The optional name of the field or entity. If not provided,  the key (alias) for this requirement in the Requirements object is used. |
| `login (optional)` | `string` | An optional login, used instead of name for User requirements. |
| `id (optional)` | `string` | An optional issue ID, used instead of name for Issue requirements. |
| `multi (optional)` | `boolean` | An optional flag, `false` by default. If `true`, a required field  must store multiple values (if applicable). |
| `outward (optional)` | `string` | The outward name of the issue link type (required for IssueLinkPrototype requirements). |
| `inward (optional)` | `string` | The inward name of the issue link type (equals outward name if not set). |
| `type (optional)` | `string`, `Object` | The data type of the entity. Can be one of the following custom field types: Build.fieldType,  OwnedField.fieldType, State.fieldType, EnumField.fieldType,  ProjectVersion.fieldType, User.fieldType, UserGroup.fieldType,  Field.dateType, Field.floatType, Field.integerType,  Field.stringType, Field.periodType.  Can also be one of the following system-wide entities: User, UserGroup,  Project, Issue, Tag, SavedQuery, IssueLinkPrototype. |
