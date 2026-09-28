# `useArrayFind`

Reactive `Array.find`, memoized in `$derived`.
Inspired by [VueUse `useArrayFind`](https://vueuse.org/shared/useArrayFind/).

## Signature

```ts
import { useArrayFind } from 'sv-utils';

useArrayFind(users, (user) => user.id === 2).value; // user | undefined
```

## Options

| Parameter | Type                                                          | Default    | Description                             |
| --------- | ------------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                                   | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => unknown` | (required) | Truthy selects the element.             |

## Returns

| Field   | Type             | Reactive | Description                     |
| ------- | ---------------- | -------- | ------------------------------- |
| `value` | `T \| undefined` | getter   | First matching element, if any. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayFind } from 'sv-utils';

	let selected = $state(2);
	let users = $state([{ id: 1 }, { id: 2 }]);
	const current = useArrayFind(
		() => users,
		(user) => user.id === selected
	);
</script>

<p>{current.value?.id ?? 'none'}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Misses yield `undefined`.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Direct port; elements are opaque (no per-item getter resolution).
