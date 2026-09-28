# `useArrayEvery`

Reactive `Array.every`, memoized in `$derived`.
Inspired by [VueUse `useArrayEvery`](https://vueuse.org/shared/useArrayEvery/).

## Signature

```ts
import { useArrayEvery } from 'sv-utils';

const allDone = useArrayEvery(items, (item) => item.done);
allDone.value; // boolean
```

## Options

| Parameter | Type                                                          | Default    | Description                             |
| --------- | ------------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                                   | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => unknown` | (required) | Falsy fails the check.                  |

## Returns

| Field   | Type      | Reactive | Description                    |
| ------- | --------- | -------- | ------------------------------ |
| `value` | `boolean` | getter   | Whether every element matches. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayEvery } from 'sv-utils';

	let items = $state([{ done: true }, { done: false }]);
	const allDone = useArrayEvery(
		() => items,
		(item) => item.done
	);
</script>

<button disabled={!allDone.value}>Submit all</button>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Empty lists yield `true` (native semantics).
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Direct port; elements are opaque (no per-item getter resolution).
