# `useArrayDifference`

Reactive difference of two arrays, with key / comparator / symmetric support.
Inspired by [VueUse `useArrayDifference`](https://vueuse.org/shared/useArrayDifference/).

## Signature

```ts
import { useArrayDifference } from 'sv-utils';

useArrayDifference([1, 2, 3], [2]).value; // [1, 3]
useArrayDifference(users, others, 'id').value;
useArrayDifference(a, b, (x, y) => x.id === y.id, { symmetric: true }).value;
```

## Options

| Parameter          | Type                                            | Default         | Description                                       |
| ------------------ | ----------------------------------------------- | --------------- | ------------------------------------------------- |
| `list`             | `MaybeGetter<readonly T[]>`                     | (required)      | Base array, or a getter over reactive state.      |
| `values`           | `MaybeGetter<readonly T[]>`                     | (required)      | Exclusion array (getters resolve per evaluation). |
| `key \| compareFn` | `keyof T \| ((value: T, othVal: T) => boolean)` | strict equality | How to compare.                                   |
| `options`          | `{ symmetric?: boolean }`                       | `{}`            | `symmetric: true` returns both directions.        |

## Returns

| Field   | Type  | Reactive | Description                                                             |
| ------- | ----- | -------- | ----------------------------------------------------------------------- |
| `value` | `T[]` | getter   | Items of `list` absent from `values` (plus the reverse when symmetric). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayDifference } from 'sv-utils';

	let all = $state([1, 2, 3, 4]);
	let hidden = $state([2, 4]);
	const visible = useArrayDifference(
		() => all,
		() => hidden
	);
</script>

<p>{visible.value.join(', ')}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Identical lists yield `[]`; key mode compares `item[key]` on both sides.
- Neither input is mutated.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Overloads mirror VueUse (key vs comparator vs options); key mode accepts
  `string`/`number`/`symbol` keys.
