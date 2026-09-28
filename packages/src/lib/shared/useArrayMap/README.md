# `useArrayMap`

Reactive `Array.map`, memoized in `$derived`.
Inspired by [VueUse `useArrayMap`](https://vueuse.org/shared/useArrayMap/).

## Signature

```ts
import { useArrayMap } from 'sv-utils';

const doubled = useArrayMap([1, 2, 3], (n) => n * 2);
doubled.value; // [2, 4, 6]
```

## Options

| Parameter | Type                                                    | Default    | Description                             |
| --------- | ------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                             | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => U` | (required) | Mapping invoked per element.            |

## Returns

| Field   | Type  | Reactive | Description                          |
| ------- | ----- | -------- | ------------------------------------ |
| `value` | `U[]` | getter   | New mapped array (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayMap } from 'sv-utils';

	let items = $state([1, 2, 3]);
	const doubled = useArrayMap(
		() => items,
		(n) => n * 2
	);
</script>

<p>{doubled.value.join(', ')}</p>
<button onclick={() => items.push(4)}>Add</button>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.
Reads recompute only when reactive dependencies change.

## Edge cases & cleanup

- The source array is never mutated.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- List elements are opaque here: unlike VueUse, getter elements are not
  resolved per item (Svelte `$state` arrays are already deeply reactive,
  so the extra resolution pass is unnecessary).
