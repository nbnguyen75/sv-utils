# `watchIgnorable`

Watch a source with the ability to apply silent updates.
Inspired by [VueUse `watchIgnorable`](https://vueuse.org/shared/watchIgnorable/).

## Signature

```ts
import { watchIgnorable } from 'sv-utils';

const { ignoreUpdates, ignorePrevAsyncUpdates, stop } = watchIgnorable(
	() => doc,
	(value) => persist(value)
);
ignoreUpdates(() => undo());
```

## Options

| Parameter   | Type                                   | Default    | Description                              |
| ----------- | -------------------------------------- | ---------- | ---------------------------------------- |
| `source`    | `MaybeGetter<T>`                       | (required) | Reactive source to observe.              |
| `cb`        | `(value, oldValue, onCleanup) => void` | (required) | Invoked per observed change.             |
| `immediate` | `boolean`                              | `false`    | Fire on mount with `oldValue` undefined. |

## Returns

| Field                    | Type                            | Description                                    |
| ------------------------ | ------------------------------- | ---------------------------------------------- |
| `ignoreUpdates`          | `(updater: () => void) => void` | Run a mutation without notifying this watcher. |
| `ignorePrevAsyncUpdates` | `() => void`                    | Drop whatever change is currently pending.     |
| `stop`                   | `() => void`                    | Stop permanently (runs pending cleanup).       |

## Examples

### Basic usage (undo without re-persisting)

```svelte
<script lang="ts">
	import { watchIgnorable } from 'sv-utils';

	let doc = $state({ text: '' });
	const history = useRefHistoryStore();
	const { ignoreUpdates } = watchIgnorable(
		() => doc,
		(value) => {
			history.push(value);
			persist(value);
		}
	);

	function undo() {
		ignoreUpdates(() => {
			doc = history.pop();
		});
	}
</script>
```

### SSR behavior

Registers only; nothing fires on the server. Must be called in component
initialization.

## Edge cases & cleanup

- Silence is a boolean guard (Svelte has no synchronous observation
  primitive for exact counters): avoid `ignoreUpdates` around mutations
  that change nothing (the stale guard would swallow the next real
  change), and know that external changes coalesced into an ignored flush
  are skipped together. Undo/redo/revert flows behave exactly.
- Previous cleanup runs before each callback and on `stop()`/unmount.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Same API shape as VueUse minus `flush`/`eventFilter`/`deep` options;
  the guard simplification above is the documented trade for Svelte's
  async-only reactivity.
