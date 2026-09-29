# `useIntervalFn`

`setInterval` wrapper with pause/resume controls and a reactive interval.
Inspired by [VueUse `useIntervalFn`](https://vueuse.org/shared/useIntervalFn/).

## Signature

```ts
import { useIntervalFn } from 'sv-utils';

const { isActive, pause, resume } = useIntervalFn(() => poll(), 5000);
```

## Options

| Parameter           | Type                  | Default    | Description                                                         |
| ------------------- | --------------------- | ---------- | ------------------------------------------------------------------- |
| `cb`                | `() => void`          | (required) | Callback invoked every period.                                      |
| `interval`          | `MaybeGetter<number>` | `1000`     | Period in ms; changing it while active restarts at the new cadence. |
| `immediate`         | `boolean`             | `true`     | Start on mount.                                                     |
| `immediateCallback` | `boolean`             | `false`    | Invoke synchronously on `resume`, plus scheduled calls.             |

## Returns

| Field      | Type         | Reactive | Description                                         |
| ---------- | ------------ | -------- | --------------------------------------------------- |
| `isActive` | `boolean`    | getter   | Whether the interval is running (destructure-safe). |
| `pause`    | `() => void` | method   | Stop; safe repeated / when idle.                    |
| `resume`   | `() => void` | method   | (Re)start; ignores non-positive intervals.          |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useIntervalFn } from 'sv-utils';

	let seconds = $state(0);
	const clock = useIntervalFn(() => (seconds += 1), 1000);
</script>

<p>{seconds}s</p>
<button onclick={() => (clock.isActive ? clock.pause() : clock.resume())}>
	{clock.isActive ? 'Pause' : 'Resume'}
</button>
```

### SSR behavior

No timer runs on the server (`isActive` stays `false`); auto-start and
reactive restarts attach on mount. Must be called in component
initialization (disposal via `$effect`).

## Edge cases & cleanup

- Non-positive intervals are ignored (stays inactive); an invalid interval
  stops rather than leaking the old cadence (intentional divergence).
- Auto-start and interval-restart live in separate effects so unmount
  disposal can never be mistaken for a restart.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Matches VueUse (`immediate`, `immediateCallback`, reactive-interval
  restart) except invalid intervals stop the timer instead of keeping the
  previous cadence running.
