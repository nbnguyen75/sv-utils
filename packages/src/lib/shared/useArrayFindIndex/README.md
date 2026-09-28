# `useArrayFindIndex`

Reactive `Array.findIndex`, memoized in `$derived`.
Inspired by [VueUse `useArrayFindIndex`](https://vueuse.org/shared/useArrayFindIndex/).

## Signature

```ts
import { useArrayFindIndex } from 'sv-utils';

useArrayFindIndex([1, 3, 4], (n) => n % 2 === 0).value; // 2
```

## Options

| Parameter | Type                                                          | Default    | Description                             |
| --------- | ------------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                                   | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => unknown` | (required) | Truthy selects the element.             |

## Returns

| Field   | Type     | Reactive | Description                    |
| ------- | -------- | -------- | ------------------------------ |
| `value` | `number` | getter   | First matching index, or `-1`. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayFindIndex } from 'sv-utils';

	let selected = $state(2);
	let ids = $state([1, 2, 3]);
	const position = useArrayFindIndex(
		() => ids,
		(id) => id === selected
	);
</script>

<p>Position: {position.value}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Misses and empty lists yield `-1`.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Direct port; elements are opaque (no per-item getter resolution).
