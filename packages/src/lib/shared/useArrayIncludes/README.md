# `useArrayIncludes`

Reactive membership check with comparator / key / from-index support.
Inspired by [VueUse `useArrayIncludes`](https://vueuse.org/shared/useArrayIncludes/).

## Signature

```ts
import { useArrayIncludes } from 'sv-utils';

useArrayIncludes([1, 2, 3], 2).value; // true
useArrayIncludes(users, 2, 'id').value; // match users[i].id === 2
useArrayIncludes(users, target, (a, b) => a.id === b.id).value;
useArrayIncludes(list, value, { fromIndex: 1 }).value;
```

## Options

| Parameter    | Type                                               | Default         | Description                                           |
| ------------ | -------------------------------------------------- | --------------- | ----------------------------------------------------- |
| `list`       | `MaybeGetter<readonly T[]>`                        | (required)      | Array, or a getter over reactive state.               |
| `value`      | `MaybeGetter<V>`                                   | (required)      | Value to search for (getters resolve per evaluation). |
| `comparator` | function \| `keyof T` \| `UseArrayIncludesOptions` | strict equality | How to compare.                                       |

`UseArrayIncludesOptions`: `{ fromIndex?: number; comparator?: function | keyof T }`.

## Returns

| Field   | Type      | Reactive | Description                |
| ------- | --------- | -------- | -------------------------- |
| `value` | `boolean` | getter   | Whether `value` was found. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayIncludes } from 'sv-utils';

	let selected = $state(0);
	const ids = [1, 2, 3];
	const isKnown = useArrayIncludes(ids, () => selected);
</script>

<p>{isKnown.value ? 'Known id' : 'Unknown id'}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Key mode compares `element[key]` against the (scalar) search value.
- The reported match index is relative to the `fromIndex` slice.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Accepts `number`/`symbol` keys in addition to VueUse's string-only key
  mode, and spells the option `fromIndex` (VueUse's object detection looks
  for a `formIndex` typo, silently ignoring a correctly spelled option).
