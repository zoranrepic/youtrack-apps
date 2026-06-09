# Iterator

An object that enables traversal through the elements in a collection.

Type: `Object`  

## Contents

### Methods
- [`next`](#next)

## Methods

### next

#### Returns

Return type: `Object`.

An object that contains values for the properties `done` and `value` properties.
If there are elements that were not traversed, `done` is `false` and `value` is the next element in the collection.
If all of the elements were traversed, `done` is `true` and `value` is `null`.
