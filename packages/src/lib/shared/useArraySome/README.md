# `useArraySome`

Reactive `Array.some`, memoized in `$derived`.
Inspired by [VueUse `useArraySome`](https://vueuse.org/shared/useArraySome/).

## Signature

```ts
import { useArraySome } from 'sv-utils';

const hasAdmin = useArraySome(users, (user) => user.role === 'admin');
hasAdmin.value; // boolean
```

## Options

| Parameter | Type                                                          | Default    | Description                             |
| --------- | ------------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                                   | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => unknown` | (required) | Truthy counts as a match.               |

## Returns

| Field   | Type      | Reactive | Description                  |
| ------- | --------- | -------- | ---------------------------- |
| `value` | `boolean` | getter   | Whether any element matches. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArraySome } from 'sv-utils';

	let items = $state([{ done: false }, { done: true }]);
	const anyDone = useArraySome(
		() => items,
		(item) => item.done
	);
</script>

<p>{anyDone.value ? 'Something is done' : 'Nothing done'}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Empty lists yield `false`.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Direct port; elements are opaque (no per-item getter resolution).
