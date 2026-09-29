# Bug Report

## Bug 1: Pagination starts from the wrong offset

### Location
`src/services/taskService.js`

### Expected behavior
For 1-based pagination, requesting `page=1&limit=10` should return the first 10 tasks, and `page=2&limit=10` should return tasks 11-20.

### Actual behavior
The pagination logic originally used:

```js
const offset = page * limit;