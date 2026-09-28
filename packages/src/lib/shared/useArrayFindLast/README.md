# `useArrayFindLast`

Reactive `Array.findLast` via a manual reverse scan (no ES2023 dependency).
Inspired by [VueUse `useArrayFindLast`](https://vueuse.org/shared/useArrayFindLast/).

## Signature

```ts
import { useArrayFindLast } from 'sv-utils';

useArrayFindLast([2, 1, 4], (n) => n % 2 === 0).value; // 4
```

## Options

| Parameter | Type                                                          | Default    | Description                             |
| --------- | ------------------------------------------------------------- | ---------- | --------------------------------------- |
| `list`    | `MaybeGetter<readonly T[]>`                                   | (required) | Array, or a getter over reactive state. |
| `fn`      | `(element: T, index: number, array: readonly T[]) => unknown` | (required) | Scanned from the end.                   |

## Returns

| Field   | Type             | Reactive | Description                    |
| ------- | ---------------- | -------- | ------------------------------ |
| `value` | `T \| undefined` | getter   | Last matching element, if any. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useArrayFindLast } from 'sv-utils';

	let events = $state([{ type: 'a' }, { type: 'b' }, { type: 'a' }]);
	const lastA = useArrayFindLast(
		() => events,
		(event) => event.type === 'a'
	);
</script>

<p>Last A at index {events.indexOf(lastA.value)}</p>
```

### SSR behavior

Pure derived logic with no DOM access and no effects — safe during SSR.

## Edge cases & cleanup

- Misses yield `undefined`; the predicate sees native indices.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Same manual reverse scan as VueUse's pre-ES2023 fallback (works on any
  lib target); elements are opaque (no per-item getter resolution).
