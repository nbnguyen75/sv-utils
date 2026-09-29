# `watchTriggerable`

Manually triggerable watcher with silence controls.
Inspired by [VueUse `watchTriggerable`](https://vueuse.org/shared/watchTriggerable/).

## Signature

```ts
import { watchTriggerable } from 'sv-utils';

const { trigger, ignoreUpdates, stop } = watchTriggerable(
	() => settings,
	(value) => apply(value)
);
trigger(); // run now with the current value
```

## Options

| Parameter   | Type                                | Default    | Description                                                             |
| ----------- | ----------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `source`    | `MaybeGetter<T>`                    | (required) | Reactive source to observe.                                             |
| `cb`        | `(value, oldValue, onCleanup) => R` | (required) | Invoked per change or `trigger()`; its return flows out of `trigger()`. |
| `immediate` | `boolean`                           | `false`    | Fire on mount with `oldValue` undefined.                                |

## Returns

| Field                    | Type                            | Description                                                       |
| ------------------------ | ------------------------------- | ----------------------------------------------------------------- |
| `trigger`                | `() => R`                       | Run the callback now with the current value (`oldValue` unknown). |
| `ignoreUpdates`          | `(updater: () => void) => void` | Silent mutation (see `watchIgnorable`).                           |
| `ignorePrevAsyncUpdates` | `() => void`                    | Drop the pending change.                                          |
| `stop`                   | `() => void`                    | Stop permanently (runs pending cleanup).                          |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { watchTriggerable } from 'sv-utils';

	let settings = $state({ theme: 'light' });
	const { trigger } = watchTriggerable(
		() => settings,
		(value) => applyTheme(value),
		{ immediate: true }
	);
</script>

<button onclick={() => trigger()}>Re-apply theme</button>
```

### SSR behavior

Registers only; nothing fires on the server. Must be called in component
initialization.

## Edge cases & cleanup

- `trigger()` runs inside `ignoreUpdates`, so the manual run never causes
  a duplicate notification on flush.
- Previous cleanup runs before each callback (manual or observed) and on
  `stop()`/unmount.
- Must be called in component initialization (uses `$effect` via
  `watchIgnorable`).

## Parity notes

- Composes our `watchIgnorable` exactly as VueUse composes its own; same
  `trigger` + silence-control shape, minus `flush`/`eventFilter` options.
