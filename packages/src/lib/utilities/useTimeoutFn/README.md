# `useTimeoutFn`

`setTimeout` wrapper with start/stop controls and pending state.
Inspired by [VueUse `useTimeoutFn`](https://vueuse.org/shared/useTimeoutFn/).

## Signature

```ts
import { useTimeoutFn } from 'sv-utils';

const { isPending, start, stop } = useTimeoutFn(() => save(), 500);
start('draft-1');
```

## Options

| Parameter           | Type                      | Default    | Description                                                          |
| ------------------- | ------------------------- | ---------- | -------------------------------------------------------------------- |
| `cb`                | `(...args: Args) => void` | (required) | Callback invoked once per arming.                                    |
| `interval`          | `MaybeGetter<number>`     | (required) | Delay in ms; getters resolve at each `start`.                        |
| `immediate`         | `boolean`                 | `true`     | Start on mount (browser only).                                       |
| `immediateCallback` | `boolean`                 | `false`    | Invoke the callback synchronously on `start`, plus the delayed call. |

## Returns

| Field       | Type                      | Reactive | Description                                    |
| ----------- | ------------------------- | -------- | ---------------------------------------------- |
| `isPending` | `boolean`                 | getter   | Whether a timeout is armed (destructure-safe). |
| `start`     | `(...args: Args) => void` | method   | Arm (or re-arm); clears a running timer first. |
| `stop`      | `() => void`              | method   | Disarm; safe repeated / when idle.             |

## Examples

### Basic usage

```ts
import { useTimeoutFn } from 'sv-utils';

const { start, stop } = useTimeoutFn((draft: string) => autosave(draft), 1000, {
	immediate: false
});

input.addEventListener('input', (event) => start(event.target.value));
```

### SSR behavior

No timer runs on the server (`isPending` stays `false`); with `immediate`
the timer arms on mount. Must be called in component initialization
(disposal via `$effect`).

## Edge cases & cleanup

- Restarting clears the previous timer: exactly one firing per arming.
- `stop()` on unmount is automatic; manual `stop()` is idempotent.
- The immediate edge invokes the callback **without** arguments (VueUse
  parity); delayed calls receive the `start(...)` args.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Reactive intervals are read per `start()` but do **not** restart a
  running timer (VueUse doesn't watch either). `immediateCallback`
  semantics match.
