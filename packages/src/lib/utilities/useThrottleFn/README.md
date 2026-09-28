# `useThrottleFn`

Throttle helper with lodash-style `leading` / `trailing` semantics,
vendored with zero dependencies.
Inspired by [VueUse `useThrottleFn`](https://vueuse.org/shared/useThrottleFn/).

## Signature

```ts
import { useThrottleFn } from 'sv-utils';

const onScroll = useThrottleFn(() => update(), 200);
const onResize = useThrottleFn(layout, 150, { leading: false });
```

## Options

| Parameter  | Type                | Default    | Description                                                |
| ---------- | ------------------- | ---------- | ---------------------------------------------------------- |
| `fn`       | `(...args) => void` | (required) | Function to throttle.                                      |
| `interval` | `number`            | `200`      | Minimum ms between invocations; `<= 0` invokes every call. |
| `leading`  | `boolean`           | `true`     | Invoke on the leading edge of the window.                  |
| `trailing` | `boolean`           | `true`     | Invoke on the trailing edge with the latest args.          |

## Returns

| Field    | Type                | Description                                            |
| -------- | ------------------- | ------------------------------------------------------ |
| (call)   | `(...args) => void` | Throttled invocation; at most one per `interval`.      |
| `cancel` | `() => void`        | Drop pending trailing call and reset the window.       |
| `flush`  | `() => void`        | Invoke the pending trailing call now; no-op when idle. |

## Examples

### Basic usage

```ts
import { useThrottleFn } from 'sv-utils';

const onScroll = useThrottleFn(() => {
	saveScrollPosition(window.scrollY);
}, 200);

window.addEventListener('scroll', onScroll, { passive: true });
```

### SSR behavior

Pure logic, no DOM access — safe to create and call during SSR.

## Edge cases & cleanup

- With `leading: false`, the first call in a window is suppressed and the
  trailing call fires at the window end; once a full window passes quietly,
  the next call leads again (VueUse parity).
- With `trailing: false`, at most one leading call per window, nothing queued.
- `cancel()` resets the window so the next call leads immediately.
- Returned function is not reactive — it is a stable closure.

## Parity notes

- Mirrors VueUse's `throttleFilter` (per-call timer reset included) and adds
  `flush()`, which VueUse only exposes on its debounced wrapper. Unlike
  VueUse, the wrapper stays synchronous: no promise wrapper, no `this`
  forwarding, no `rejectOnCancel`.
