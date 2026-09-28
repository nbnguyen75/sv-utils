# `useSorted`

Reactive sorted array — copy-on-read by default, in-place with `dirty`.
Inspired by [VueUse `useSorted`](https://vueuse.org/core/useSorted/).

## Signature

```ts
import { useSorted } from 'sv-utils';

useSorted([3, 1, 2]).value; // [1, 2, 3]
useSorted(users, (a, b) => a.age - b.age).value;
useSorted(users, { compareFn, sortFn }).value;
useSorted(source, { dirty: true }).value; // sorts source in place
```

## Options

| Parameter   | Type                           | Default          | Description                                      |
| ----------- | ------------------------------ | ---------------- | ------------------------------------------------ |
| `source`    | `MaybeGetter<T[]>`             | (required)       | Array, or a getter over reactive state.          |
| `compareFn` | `(a: T, b: T) => number`       | numeric subtract | Ordering; required for strings/objects.          |
| `sortFn`    | `(arr: T[], compareFn) => T[]` | in-place `sort`  | Custom sort implementation.                      |
| `dirty`     | `boolean`                      | `false`          | Sort the source in place (needs component init). |

Overloads: `(source, compareFn?)`, `(source, options?)`, `(source, compareFn?, options?)`.

## Returns

| Field   | Type  | Reactive | Description                                          |
| ------- | ----- | -------- | ---------------------------------------------------- |
| `value` | `T[]` | getter   | Sorted copy — or the mutated source in `dirty` mode. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useSorted } from 'sv-utils';

	let scores = $state([30, 10, 20]);
	const ranked = useSorted(() => scores);
</script>

<p>{ranked.value.join(', ')}</p>
```

### SSR behavior

Copy mode is pure derived logic — safe during SSR. `dirty` mode attaches
an in-place sort effect on mount and disposes with the component.

## Edge cases & cleanup

- Copy mode never mutates the source; `dirty` mode splices only on real
  order changes so its own effect settles instead of looping.
- The numeric-subtract default only orders numbers — pass `compareFn`
  (e.g. `localeCompare`) for anything else.
- `dirty` requires a mutable array source and component initialization
  (uses `$effect`).

## Parity notes

- Same overload shapes and defaults as VueUse; `dirty` matches its
  in-place semantics with an order-change guard for effect safety.
