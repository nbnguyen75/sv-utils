# `useCountdown`

Reactive countdown timer in seconds, with tick/complete callbacks.
Inspired by [VueUse `useCountdown`](https://vueuse.org/core/useCountdown/).

## Signature

```ts
import { useCountdown } from 'sv-utils';

const timer = useCountdown(60, {
	onTick: () => update(),
	onComplete: () => finish()
});
timer.start();
```

## Options

| Parameter          | Type                                              | Default            | Description                                 |
| ------------------ | ------------------------------------------------- | ------------------ | ------------------------------------------- |
| `initialCountdown` | `MaybeGetter<number>`                             | (required)         | Starting seconds; re-resolves on `reset()`. |
| `scheduler`        | `(cb: () => void) => { pause; resume; isActive }` | 1s `useIntervalFn` | Tick source factory.                        |
| `onTick`           | `() => void`                                      | —                  | Called on every tick.                       |
| `onComplete`       | `() => void`                                      | —                  | Called once when reaching zero.             |

## Returns

| Field       | Type                                        | Reactive        | Description                             |
| ----------- | ------------------------------------------- | --------------- | --------------------------------------- |
| `remaining` | `number`                                    | getter + setter | Seconds left (destructure-safe).        |
| `isActive`  | `boolean`                                   | getter          | Whether it is ticking.                  |
| `reset`     | `(countdown?: MaybeGetter<number>) => void` | method          | Reset without starting.                 |
| `stop`      | `() => void`                                | method          | Pause and reset to the initial value.   |
| `start`     | `(countdown?: MaybeGetter<number>) => void` | method          | Reset and start.                        |
| `pause`     | `() => void`                                | method          | Pause, keeping the value.               |
| `resume`    | `() => void`                                | method          | Resume (no-op when active or finished). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useCountdown } from 'sv-utils';

	const timer = useCountdown(10, { onComplete: () => alert('done') });
	timer.start();
</script>

<p>{timer.remaining}s</p>
<button onclick={() => timer.pause()}>Pause</button>
```

### SSR behavior

Constructs quietly (no ticking, no callbacks) on the server. The default
1-second scheduler attaches on mount; nothing ticks during SSR. Safe with
or without SvelteKit.

## Edge cases & cleanup

- Clamps at zero and pauses itself on completion; `onComplete` fires once.
- `resume()` on a finished or active countdown is a no-op (use `start()`
  to run again).
- `start()` always resets first; `resume()` never does — set `remaining`
  directly to continue from a custom value.
- Disposal (including the default scheduler's timer) is automatic.
- With default options this must be called in component initialization
  (the scheduler owns effects).

## Parity notes

- Same `reset`/`stop`/`start`/`pause`/`resume` semantics; `remaining` is
  additionally writable. Custom schedulers receive the same
  pause/resume/isActive shape VueUse expects.
