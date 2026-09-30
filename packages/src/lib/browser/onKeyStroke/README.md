# `onKeyStroke`

Listen for keyboard keystrokes matching a key, a list, or a predicate.
Inspired by [VueUse `onKeyStroke`](https://vueuse.org/core/onKeyStroke/).

## Signature

```ts
import { onKeyStroke, onKeyDown, onKeyPressed, onKeyUp } from 'sv-utils';

const stop = onKeyStroke('Escape', () => close());
```

## Options

`onKeyStroke` takes `(key, handler, options?)` or `(handler, options?)`.
The shorthands fix the event name and drop it from the options.

| Option      | Type                                            | Default     | Description                                      |
| ----------- | ----------------------------------------------- | ----------- | ------------------------------------------------ |
| `eventName` | `'keydown' \| 'keypress' \| 'keyup'`            | `'keydown'` | Event to listen for (`onKeyStroke` only).        |
| `target`    | `MaybeGetter<EventTarget \| null \| undefined>` | `window`    | Element (or getter) receiving keyboard events.   |
| `passive`   | `boolean`                                       | `false`     | Register the listener as passive.                |
| `dedupe`    | `MaybeGetter<boolean>`                          | `false`     | Ignore auto-repeated events; resolved per event. |

`KeyFilter` is `true | string | string[] | KeyPredicate`.

## Returns

A `stop()` function. Stopping silences the instance; the listener
disposes with the component either way.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { onKeyStroke } from 'sv-utils';

	onKeyStroke('Escape', () => (open = false));
</script>
```

### Combos and shorthands

```ts
onKeyStroke(['a', 'b'], () => select(), { dedupe: true });
onKeyDown('Enter', () => submit(), { target: () => input });
```

### SSR behavior

Listeners are registered only in the browser. On the server the call
returns a stop function and nothing else happens.

## Edge cases & cleanup

- With no key argument, every keystroke fires the handler.
- `dedupe` is resolved per event, so a reactive flag can arm it
  mid-session (e.g. only while composing).
- `passive` defaults to `false` (matching upstream), so handlers may
  still `preventDefault()`.
- `stop()` silences permanently; disposal cleans up regardless.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Upstream returns the raw listener cleanup from its `useEventListener`;
  ours returns an equivalent silencing stop because this library's
  `useEventListener` disposes with the component instead.
- The reactive fields are getter-backed rather than refs, so
  destructuring stays reactive.
