# `useArrayReduce`

Reactive `Array.reduce` with or without an initial value.
Inspired by [VueUse `useArrayReduce`](https://vueuse.org/shared/useArrayReduce/).

## Signature

```ts
import { useArrayReduce } from 'sv-utils';

useArrayReduce([1, 2, 3], (sum, n) => sum + n).value; // 6
useArrayReduce([1, 2, 3], (sum, n) => sum + n, 100).value; // 106
```

## Options

| Parameter      | Type                                   | Default    | Description                                          |
| -------------- | -------------------------------------- | ---------- | ---------------------------------------------------- |
| `list`         | `MaybeGetter<readonly T[]>`            | (required) | Array, or a getter over reactive state.              |
| `reducer`      | `(previous, current, index) => result` | (required) | Reduction step.                                      |
| `initialValue` | `MaybeGetter<U>`                       | —          | Seed; a function seed is itself treated as a getter. |

## Returns

| Field   | Type | Reactive | Description       |
| ------- | ---- | -------- | ----------------- |
| `value` | `U`  | getter   | Reduction result. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayReduce } from 'sv-utils';

	let lines = $state([{ total: 10 }, { total: 20 }]);
	const grand = useArrayReduce(
		() => lines,
		(sum, line) => sum + line.total,
		0
	);
</script>

<p>Total: {grand.value}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Without an initial value, empty lists throw `TypeError` (native reduce
  semantics); indices then start at `1`.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Overloads mirror VueUse, including the function-seed-as-getter quirk.
  Elements are opaque (no per-item getter resolution).
