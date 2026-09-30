# `useMagicKeys`

Reactive pressed-key state with alias and combination support.
Inspired by [VueUse `useMagicKeys`](https://vueuse.org/core/useMagicKeys/).

## Signature

```ts
import { useMagicKeys } from 'sv-utils';

const keys = useMagicKeys();
keys['meta+k']; // true while both are held
```

## Options

| Option         | Type                                        | Default                    | Description                               |
| -------------- | ------------------------------------------- | -------------------------- | ----------------------------------------- |
| `target`       | `MaybeGetter<EventTarget>`                  | `window`                   | Element (or getter) receiving key events. |
| `aliasMap`     | `Record<string, string>`                    | `DefaultMagicKeysAliasMap` | Lowercase aliases (`ctrl` → `control`).   |
| `passive`      | `boolean`                                   | `true`                     | Register listeners as passive.            |
| `onEventFired` | `(event: KeyboardEvent) => void \| boolean` | —                          | Hook called with every keydown/keyup.     |

## Returns

A proxy object: read any key by name (`keys.shift`, case-insensitive),
alias (`keys.ctrl`), or combination (`keys['control+a']`, split on
`+`, `_`, `-`). `keys.current` is the live set of pressed raw keys.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useMagicKeys } from 'sv-utils';

	const keys = useMagicKeys();
</script>

<p>Shift held: {keys.shift}</p><p>Save combo: {keys['control+s']}</p>
```

### Custom aliases

```ts
const keys = useMagicKeys({ aliasMap: { hyper: 'control' } });
keys.hyper; // true while Control is held
```

### SSR behavior

Listeners are registered only in the browser. On the server every key
reads `false` and `current` is empty.

## Edge cases & cleanup

- Keys arm on first access: read a key once (templates do this on
  render) and it flips live from then on. Presses that happen before
  the first read are not retroactively reported — matching upstream's
  lazy ref creation.
- Combinations evaluate live from their parts on every read, so
  `keys['ctrl+shift+period']` needs no setup.
- Releasing the window (blur/focus) resets all state, covering keys
  released while the page had no focus.
- On macOS, releasing Meta drops its whole tracked combination, since
  those keys never fire `keyup`.
- All listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse has a `reactive` option switching between refs and raw values;
  this port always returns plain booleans, which are reactive reads in
  Svelte by default, so the option is dropped.
- Individual keys and combinations are computed on access from `$state`
  instead of per-key refs — identical observable behavior in the
  access-before-press order upstream requires too.
