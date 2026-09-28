# `useArrayJoin`

Reactive `Array.join`, memoized in `$derived`.
Inspired by [VueUse `useArrayJoin`](https://vueuse.org/shared/useArrayJoin/).

## Signature

```ts
import { useArrayJoin } from 'sv-utils';

useArrayJoin(['a', 'b'], ' - ').value; // 'a - b'
```

## Options

| Parameter   | Type                              | Default    | Description                                     |
| ----------- | --------------------------------- | ---------- | ----------------------------------------------- |
| `list`      | `MaybeGetter<readonly unknown[]>` | (required) | Array, or a getter over reactive state.         |
| `separator` | `MaybeGetter<string>`             | `','`      | Pair separator; getters resolve per evaluation. |

## Returns

| Field   | Type     | Reactive | Description                           |
| ------- | -------- | -------- | ------------------------------------- |
| `value` | `string` | getter   | Joined string (`''` for empty lists). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayJoin } from 'sv-utils';

	let tags = $state(['svelte', 'runes']);
	const label = useArrayJoin(() => tags, ', ');
</script>

<p>{label.value}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Empty lists yield `''` (native semantics).
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Direct port; elements are opaque (no per-item getter resolution).
