# `useArrayFilter`

Reactive `Array.filter`, memoized in `$derived`.
Inspired by [VueUse `useArrayFilter`](https://vueuse.org/shared/useArrayFilter/).

## Signature

```ts
import { useArrayFilter } from 'sv-utils';

const evens = useArrayFilter([1, 2, 3, 4], (n) => n % 2 === 0);
evens.value; // [2, 4]
```

## Options

| Parameter | Type                                                          | Default    | Description                             |
| --------- | ------------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                                   | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => unknown` | (required) | Truthy keeps the element.               |

## Returns

| Field   | Type  | Reactive | Description                        |
| ------- | ----- | -------- | ---------------------------------- |
| `value` | `T[]` | getter   | Filtered array (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayFilter } from 'sv-utils';

	let query = $state('');
	let users = $state([{ name: 'ada' }, { name: 'grace' }]);
	const matches = useArrayFilter(
		() => users,
		(user) => user.name.includes(query)
	);
</script>

<input bind:value={query} /><p>{matches.value.length} matches</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- The source array is never mutated.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Same as `useArrayMap`: elements are opaque (no per-item getter
  resolution); `$state` proxies already track deeply.
