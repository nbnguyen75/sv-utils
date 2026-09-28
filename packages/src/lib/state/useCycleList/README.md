# `useCycleList`

Cycle through a list of items with wraparound navigation.
Inspired by [VueUse `useCycleList`](https://vueuse.org/core/useCycleList/).

## Signature

```ts
import { useCycleList } from 'sv-utils';

const { value, index, next, prev, go } = useCycleList(['a', 'b', 'c']);
next(); // 'b'
```

## Options

| Parameter       | Type                              | Default    | Description                                           |
| --------------- | --------------------------------- | ---------- | ----------------------------------------------------- |
| `list`          | `MaybeGetter<T[]>`                | (required) | Items: a plain array or a getter over reactive state. |
| `initialValue`  | `T \| (() => T)`                  | first item | Starting value.                                       |
| `fallbackIndex` | `number`                          | `0`        | Index used when the value is not found in the list.   |
| `getIndexOf`    | `(value: T, list: T[]) => number` | `indexOf`  | Custom index lookup.                                  |

## Returns

| Field   | Type                | Reactive        | Description                                       |
| ------- | ------------------- | --------------- | ------------------------------------------------- |
| `value` | `T`                 | getter + setter | Current item (destructure-safe).                  |
| `index` | `number`            | getter          | Index of the current item (`-1` for empty lists). |
| `next`  | `(n?: number) => T` | method          | Move forward `n` (default `1`) with wraparound.   |
| `prev`  | `(n?: number) => T` | method          | Move backward `n` (default `1`) with wraparound.  |
| `go`    | `(i: number) => T`  | method          | Jump to index `i`, wrapping out-of-range indices. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useCycleList } from 'sv-utils';

	const theme = useCycleList(['light', 'dark', 'system']);
</script>

<button onclick={() => theme.next()}>Theme: {theme.value}</button>
```

### SSR behavior

Initializes from the list without DOM access; safe during SSR. List
tracking attaches on mount and disposes with the component.

## Edge cases & cleanup

- Empty lists: `index` is `-1` and navigation returns the state unchanged
  instead of dividing by zero.
- When the list identity changes, the state re-anchors to the current
  index of the new list (with `fallbackIndex` for missing values).
- The list-sync effect disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `index` is read-only here — use `go(i)` instead of VueUse's writable
  `index` computed. Otherwise semantics (wraparound math, fallbacks,
  custom lookup) match.
