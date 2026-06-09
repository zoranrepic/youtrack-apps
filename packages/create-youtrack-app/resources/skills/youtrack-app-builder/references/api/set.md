# Set

The `Set` object stores unique values of any type, whether primitive values or
object references. The Set is used as storage for all multi-value objects in
this API: custom fields that store multiple values, issue links, issues in a project, and so on.
You can access single values in the collection directly (see first(), last(), get(index)),
use an iterator (see entries(), values()), or traverse with forEach(visitor)
and find(predicate) methods.

The workflow API is based on ECMAScript 5.1.
This Set implementation mimics the functionality supported by the
[ES 6 Set interface](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).

Type: `Object`  

## Contents

### Properties
- `size`
- `added`
- `removed`
- `isChanged`

### Methods
- [`add`](#add)
- [`clear`](#clear)
- [`delete`](#delete)
- [`entries`](#entries)
- [`find`](#find)
- [`first`](#first)
- [`forEach`](#foreach)
- [`get`](#get)
- [`has`](#has)
- [`isEmpty`](#isempty)
- [`isNotEmpty`](#isnotempty)
- [`last`](#last)
- [`map`](#map)
- [`slice`](#slice)
- [`values`](#values)

## Properties

| Name | Type | Description |
| --- | --- | --- |
| `size (optional)` | `number` | The number of elements in a Set. Use thoughtfully, as the calculation for large collections (like `project.issues`) may be resource consumptive. |
| `added (optional)` | `Set` | The elements that are added to a field that stores multiple values in the current transaction. Only relevant when the Set represents a multi-valued property (field) of a persistent entity. |
| `removed (optional)` | `Set` | The elements that are removed from a field that stores multiple values in the current transaction. Only relevant when the Set represents a multi-valued property (field) of a persistent entity. |
| `isChanged (optional)` | `boolean` | When the Set represents a multi-valued property (field) of a persistent entity and the field is changed in the current transaction, this property is `true`. |

## Methods

### add

Add an element to a Set. If the specified value is already present, a duplicate value is not added.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | `Object` | The element to add to the Set. |

### clear

Remove all of the values from a Set.

### delete

Remove an element from a Set. If the specified element is not present, nothing happens.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | `Object` | The element to remove from the Set. |

### entries

Get an iterator for the entries in a Set. The same as `values()`.
Use an iterator when you need to traverse over entries until a specific condition
is met and modify the entries at the same time.

#### Returns

Return type: `Iterator.<Object>`.

An iterator for the collection of values.

#### Examples

```javascript
// We want to find first Critical among issue subtasks and assign it.
const checkAndAssign = function(task) {
  if (task.fields.Priority.name === ctx.Priority.Critical.name) {
    task.fields.Assignee = ctx.currentUser;
    return true;
  }
  return false;
};
const iter = issue.links['parent for'].entries();
let v = iter.next();
while (!v.done && !checkAndAssign(v.value)) {
  v = iter.next();
}
```

#### See Also
- If you need to modify all of the elements in the Set, see forEach(visitor).
- If you need to find an element that meets specific criteria, see find(predicate).

### find

Find the first element in a Set for which a predicate function returns `true`.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `predicate` | `function` | A function with one argument that returns either true or false for a given value in the Set. |

#### Returns

Return type: `Object`.

The first value that returns `true` for the predicate function or undefined.

#### Examples

```javascript
issue.tags.find(function(tag) {
  return tag.name === 'release';
});
```

### first

Find the first object in a collection based on the order in which the elements were added to the Set.

#### Returns

Return type: `Object`.

The first object in a collection or null if the collection is empty.

### forEach

Apply a visitor function to each member of a collection.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `visitor` | `function` | The function to be applied to each member of the collection. |

#### Examples

```javascript
issue.links['parent for'].forEach(function(child) {
  child.fields.Priority = issue.fields.Priority;
});
```

### get

Find an element with a specific index position in a Set.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `index` | `number` | The ordinal index of the element to be returned from the Set. |

#### Returns

Return type: `Object`.

An object at index position in a Set, or null
if the Set contains fewer than (index + 1) elements.

### has

Checks a Set object to determine whether the specified element is present in the collection or not.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | `Object` | The element to locate in the Set. |

#### Returns

Return type: `boolean`.

If the element is found, returns `true`, otherwise, `false`.

### isEmpty

Checks a Set object to determine whether it is empty.

#### Returns

Return type: `boolean`.

If the Set is empty, returns `true`, otherwise, `false`.

### isNotEmpty

Checks a Set object to determine whether it is not empty.

#### Returns

Return type: `boolean`.

If the Set is not empty, returns `true`, otherwise, `false`.

### last

Find the last object in a collection based on the order in which the elements were added to the Set.

#### Returns

Return type: `Object`.

The last object in a collection or null if collection is empty.

### map

Transform each element in a Set and return the results as an array.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `visitor` | `function` | A function called for each value with arguments `(value, index, set)`. |

#### Returns

Return type: `Array.<*>`.

An array with the results of calling `visitor` on each element in insertion order.

#### Examples

```javascript
// Collect logins of all permitted users
const logins = issue.permittedUsers.map((u) => u.login);
```

### slice

Create a shallow copy of a portion of a Set as an array.

Since: `2025.3`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `start (optional) = `0`` | `number` | Zero-based index at which to begin extraction. Negative values are treated as 0. |
| `end (optional)` | `number` | Zero-based index before which to end extraction. If omitted, extracts through the end. |

#### Returns

Return type: `Array.<Object>`.

An array containing the extracted values in insertion order. Returns an empty array when the range is empty.

#### Examples

```javascript
// Get first 3 subtasks
const firstThree = issue.links['parent for'].slice(0, 3);
```

### values

Get an iterator for the entries in a Set. The same as `entries()`.

#### Returns

Return type: `Iterator.<Object>`.

An iterator for the collection of values.

#### See Also
- For details, see entries().
