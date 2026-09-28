# `useDebounceFn`

Debounce helper with lodash-style `leading` / `trailing` / `maxWait`
semantics, vendored with zero dependencies.
Inspired by [VueUse `useDebounceFn`](https://vueuse.org/shared/useDebounceFn/).

## Signature

```ts
import { useDebounceFn } from 'sv-utils';

const onInput = useDebounceFn((query: string) => search(query), 200);
const save = useDebounceFn(persist, 1000, { maxWait: 5000 });
```

## Options

| Parameter  | Type                | Default    | Description                                                                            |
| ---------- | ------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `fn`       | `(...args) => void` | (required) | Function to debounce.                                                                  |
| `delay`    | `number`            | `200`      | Quiet period in ms; `<= 0` invokes synchronously.                                      |
| `leading`  | `boolean`           | `false`    | Invoke on the leading edge of a burst.                                                 |
| `trailing` | `boolean`           | `true`     | Invoke on the trailing edge after `delay` ms of quiet.                                 |
| `maxWait`  | `number`            | —          | Force an invocation at most this long after burst start; `<= 0` invokes synchronously. |

## Returns

| Field     | Type                | Description                                              |
| --------- | ------------------- | -------------------------------------------------------- |
| (call)    | `(...args) => void` | Debounced invocation; latest args win.                   |
| `cancel`  | `() => void`        | Drop pending invocation; safe repeated / when idle.      |
| `flush`   | `() => void`        | Invoke now with latest args if pending; no-op when idle. |
| `pending` | `() => boolean`     | Whether a timer is armed.                                |

## Examples

### Basic usage

```ts
import { useDebounceFn } from 'sv-utils';

const onType = useDebounceFn((value: string) => {
	fetch(`/api/search?q=${value}`);
}, 250);

input.addEventListener('input', (event) => onType(event.target.value));
onType.cancel(); // e.g. on unmount or submit
```

### SSR behavior

Pure logic, no DOM access — safe to create and call during SSR. Pending
timers simply never fire on the server; call `cancel()`/`flush()` if a
server context is discarded.

## Edge cases & cleanup

- Sustained bursts invoke at most every `maxWait` (latest args), plus a
  final trailing call after quiet — unless `trailing: false`.
- `leading: true` invokes the first call immediately, then debounces the
  rest; with `trailing: false` each burst invokes exactly once.
- Cancelled wrappers stay reusable; `flush()` after `cancel()` is a no-op.
- Returned function is not reactive — it is a stable closure.

## Parity notes

- Extends VueUse's `debounceFilter` (which is trailing-only) with
  `leading`/`trailing` edges and a `pending()` probe mirroring its
  `isPending`. Unlike VueUse, the wrapper stays synchronous: no promise
  wrapper, no `this` forwarding, no `rejectOnCancel`.
