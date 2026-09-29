# `watchAtMost`

Watch a source at most `count` times, with pause/resume/stop controls.
Inspired by [VueUse `watchAtMost`](https://vueuse.org/shared/watchAtMost/).

## Signature

```ts
import { watchAtMost } from 'sv-utils';

const watcher = watchAtMost(
	() => query,
	(value) => search(value),
	{ count: 3 }
);
watcher.pause();
```

## Options

| Parameter   | Type                                   | Default    | Description                                               |
| ----------- | -------------------------------------- | ---------- | --------------------------------------------------------- |
| `source`    | `MaybeGetter<T>`                       | (required) | Reactive source: a value or a getter over reactive state. |
| `cb`        | `(value, oldValue, onCleanup) => void` | (required) | Invoked per observed change.                              |
| `count`     | `MaybeGetter<number>`                  | (required) | Max invocations before auto-stop; resolves per fire.      |
| `immediate` | `boolean`                              | `false`    | Fire on mount (counts as the first invocation).           |

## Returns

| Field    | Type         | Reactive | Description                                              |
| -------- | ------------ | -------- | -------------------------------------------------------- |
| `stop`   | `() => void` | method   | Stop permanently.                                        |
| `pause`  | `() => void` | method   | Suspend (changes while paused are dropped, no catch-up). |
| `resume` | `() => void` | method   | Resume fresh (never refires for missed changes).         |
| `calls`  | `number`     | getter   | Invocations so far (destructure-safe).                   |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { watchAtMost } from 'sv-utils';

	let draft = $state('');
	// Autosave the first 5 edits, then stop listening.
	watchAtMost(
		() => draft,
		(value) => save(value),
		{ count: 5 }
	);
</script>
```

### SSR behavior

Registers only; nothing fires on the server. Must be called in component
initialization.

## Edge cases & cleanup

- Fires only on genuine source changes (re-runs from pause/resume toggles
  never fire spuriously).
- `stop()` (including auto-stop at the limit) is permanent; unmount
  disposal is automatic.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same count-then-stop semantics (the final counted call still fires);
  pause/resume is built in rather than composed via a pausable filter.
  No `deep`/`flush`/`eventFilter` options.
