# `useArrayUnique`

Reactive deduplicated array, memoized in `$derived`.
Inspired by [VueUse `useArrayUnique`](https://vueuse.org/shared/useArrayUnique/).

## Signature

```ts
import { useArrayUnique } from 'sv-utils';

const unique = useArrayUnique([1, 2, 1, 3]);
unique.value; // [1, 2, 3]

const byId = useArrayUnique(users, (a, b) => a.id === b.id);
```

## Options

| Parameter   | Type                                           | Default         | Description                             |
| ----------- | ---------------------------------------------- | --------------- | --------------------------------------- |
| `list`      | `MaybeGetter<readonly T[]>`                    | (required)      | Array, or a getter over reactive state. |
| `compareFn` | `(a: T, b: T, array: readonly T[]) => boolean` | `Set` semantics | Return `true` when `a` duplicates `b`.  |

## Returns

| Field   | Type  | Reactive | Description                                |
| ------- | ----- | -------- | ------------------------------------------ |
| `value` | `T[]` | getter   | Deduplicated array, first occurrences win. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayUnique } from 'sv-utils';

	let tags = $state(['svelte', 'runes', 'svelte']);
	const unique = useArrayUnique(() => tags);
</script>

<p>{unique.value.join(', ')}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Default equality is `Set` semantics (reference equality for objects).
- The source array is never mutated.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Same semantics as VueUse, including first-occurrence order with a custom
  comparator.
