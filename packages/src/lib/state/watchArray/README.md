# `watchArray`

Watch an array with per-change additions and removals.
Inspired by [VueUse `watchArray`](https://vueuse.org/shared/watchArray/).

## Signature

```ts
import { watchArray } from 'sv-utils';

const stop = watchArray(
	() => items,
	(value, oldValue, added, removed, onCleanup) => {
		console.log('added', added, 'removed', removed);
	}
);
```

## Options

| Parameter   | Type                                                   | Default    | Description                                    |
| ----------- | ------------------------------------------------------ | ---------- | ---------------------------------------------- |
| `source`    | `MaybeGetter<T[]>`                                     | (required) | Array, or a getter over reactive state.        |
| `cb`        | `(value, oldValue, added, removed, onCleanup) => void` | (required) | Invoked per change.                            |
| `immediate` | `boolean`                                              | `false`    | Fire on mount with `oldValue`/`removed` empty. |

## Returns

`stop: () => void` — ignore further changes and run pending cleanup.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { watchArray } from 'sv-utils';

	let ids = $state([1, 2, 3]);
	watchArray(
		() => ids,
		(_value, _old, added, removed) => syncSelection(added, removed)
	);
</script>
```

### SSR behavior

Registers only; the first evaluation happens on mount. Nothing runs on
the server. Must be called in component initialization.

## Edge cases & cleanup

- Identity-diffed and duplicate-safe: each old item matches at most one
  new item (`[1,2,1]` → `[1,3]` reports added `[3]`, removed `[2,1]`).
- Previous cleanup runs before each callback and on `stop()`/unmount.
- `stop()` is permanent; disposal on unmount is automatic.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Same diff algorithm and callback shape as VueUse (including
  `onCleanup`); stopping is flag-based since effects cannot unsubscribe
  early. No `deep`/`flush` options — Svelte tracks whatever the getter
  reads, always with effect timing.
