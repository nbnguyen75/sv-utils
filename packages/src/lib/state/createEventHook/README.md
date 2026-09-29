# `createEventHook`

Tiny typed pub/sub event hook.
Inspired by [VueUse `createEventHook`](https://vueuse.org/shared/createEventHook/).

## Signature

```ts
import { createEventHook } from 'sv-utils';

const hook = createEventHook<string>();
const subscription = hook.on((data) => console.log(data));
await hook.trigger('go');
subscription.off();
```

## Options

None — `createEventHook<T>()` takes no arguments.

## Returns

| Field     | Type                              | Description                                         |
| --------- | --------------------------------- | --------------------------------------------------- |
| `on`      | `(fn) => { off: () => void }`     | Subscribe; the handle unsubscribes.                 |
| `off`     | `(fn) => void`                    | Unsubscribe directly.                               |
| `trigger` | `(...args) => Promise<unknown[]>` | Notify all subscribers; resolves with every result. |
| `clear`   | `() => void`                      | Remove all subscribers.                             |

## Examples

### Basic usage

```ts
import { createEventHook } from 'sv-utils';

const bus = createEventHook<{ id: number }>();
bus.on(({ id }) => refresh(id));
await bus.trigger({ id: 7 });
```

### SSR behavior

Framework-free with no DOM access and no effects — safe to create and use
anywhere, including SSR. Hooks hold subscribers until `off()`/`clear()`.

## Edge cases & cleanup

- No scope auto-cleanup (unlike VueUse): unsubscribe in component teardown
  when the hook outlives the subscriber.
- `trigger` awaits every subscriber, including async ones.

## Parity notes

- Same `on`/`off`/`trigger`/`clear` shape with strict callback types;
  only the scope-disposal integration is dropped.
