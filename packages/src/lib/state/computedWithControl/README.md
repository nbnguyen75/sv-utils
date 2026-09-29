# `computedWithControl`

Derived value with explicit dependencies and a manual refresh trigger.
Inspired by [VueUse `computedWithControl`](https://vueuse.org/shared/computedWithControl/).

## Signature

```ts
import { computedWithControl } from 'sv-utils';

const total = computedWithControl(
	() => cart,
	() => cart.items.reduce((sum, item) => sum + item.price, 0)
);
total.trigger(); // force refresh

const name = computedWithControl(() => user, {
	get: () => user.name.toUpperCase(),
	set: (next) => (user.name = next.toLowerCase())
});
```

## Options

| Parameter | Type                                             | Default    | Description                                                  |
| --------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------ |
| `source`  | `MaybeGetter<unknown>`                           | (required) | Explicit dependencies: re-derives when these change.         |
| `fn`      | `() => T` \| `{ get(): T; set(value: T): void }` | (required) | Derivation (reads nothing else reactively), or get/set pair. |

## Returns

| Field     | Type         | Reactive | Description                                                          |
| --------- | ------------ | -------- | -------------------------------------------------------------------- |
| `value`   | `T`          | getter   | Memoized derivation (writable form adds a setter, destructure-safe). |
| `trigger` | `() => void` | method   | Force recomputation on next read.                                    |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { computedWithControl } from 'sv-utils';

	let items = $state([1, 2, 3]);
	let currency = $state('USD');
	// Recomputes only when items change — never for currency moves.
	const total = computedWithControl(
		() => items,
		() => items.reduce((sum, n) => sum + n, 0)
	);
</script>

<p>{total.value} {currency}</p>
```

### SSR behavior

Computes on first read without DOM access; safe during SSR. The source
subscription attaches on mount and disposes with the component.

## Edge cases & cleanup

- `fn` runs untracked: reactive reads inside it never invalidate the
  derivation — only `source` changes and `trigger()` do.
- Unrelated state churn never recomputes (the point of the utility).
- Must be called in component initialization (source tracking via `$effect`).

## Parity notes

- Same explicit-deps + trigger + writable-form semantics via an epoch
  counter instead of Vue's dirty-flag custom ref. No `deep`/`flush`
  watch options.
