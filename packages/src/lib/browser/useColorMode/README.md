# `useColorMode`

Reactive color mode with persistence and DOM syncing.
Inspired by [VueUse `useColorMode`](https://vueuse.org/core/useColorMode/).

## Signature

```ts
import { useColorMode } from 'sv-utils';

const mode = useColorMode();
mode.value = 'dark'; // persisted + applied to <html>
```

## Options

| Option              | Type                                                  | Default                                      | Description                                                       |
| ------------------- | ----------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `selector`          | `string \| MaybeGetter<Element \| null \| undefined>` | `'html'`                                     | Element receiving the mode marker.                                |
| `attribute`         | `string`                                              | `'class'`                                    | `'class'` toggles classes; anything else sets an attribute.       |
| `initialValue`      | `MaybeGetter<T \| BasicColorSchema>`                  | `'auto'`                                     | Starting mode; resolved once at creation.                         |
| `modes`             | `Partial<Record<T \| BasicColorSchema, string>>`      | `{ auto: '', light: 'light', dark: 'dark' }` | Class (or value) per mode.                                        |
| `onChanged`         | `(mode, defaultHandler) => void`                      | —                                            | Override the DOM update (call `defaultHandler` to keep it).       |
| `storageRef`        | `{ value: T \| BasicColorSchema }`                    | —                                            | External store; skips persistence. Must be reactive to propagate. |
| `storageKey`        | `string \| null`                                      | `'sv-color-scheme'`                          | Persistence key; `null` disables.                                 |
| `storage`           | `Storage \| null`                                     | `localStorage`                               | Storage backend (browser only).                                   |
| `disableTransition` | `boolean`                                             | `true`                                       | Suppress CSS transitions while switching.                         |

## Returns

| Field    | Type                    | Reactive      | Description                         |
| -------- | ----------------------- | ------------- | ----------------------------------- |
| `value`  | `T \| BasicColorMode`   | getter/setter | Effective mode. Assign to change.   |
| `store`  | `T \| BasicColorSchema` | getter/setter | Stored mode (`'auto'` included).    |
| `system` | `BasicColorMode`        | getter        | OS preference (`'dark'`/`'light'`). |
| `state`  | `T \| BasicColorMode`   | getter        | Effective mode (same as `value`).   |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useColorMode } from 'sv-utils';

	const mode = useColorMode();
</script>

<button onclick={() => (mode.value = mode.value === 'dark' ? 'light' : 'dark')}>
	{mode.value === 'dark' ? '☀️ Light' : '🌙 Dark'}
</button>
```

### Custom themes via attributes

```ts
const mode = useColorMode({
	attribute: 'data-theme',
	modes: { light: 'day', dark: 'night', auto: '' }
});
mode.store = 'auto'; // follows the OS again
```

### SSR behavior

The store hydrates from storage on the client; on the server `value`
reflects the initial mode and the DOM is untouched. Avoid hard-coding
a theme class in server HTML to prevent hydration mismatch.

## Edge cases & cleanup

- `'auto'` resolves through the OS preference live: flipping the OS
  theme updates `value`/`state` while `store` stays `'auto'`.
- Class mode only touches known mode classes, leaving unrelated
  classes alone; attribute mode sets the attribute directly.
- The transition guard `<style>` is always removed in the same task —
  a forced reflow applies the switch atomically.
- Storage writes are write-through and cross-tab `storage` events
  update the store (inherited from `useStorage`).
- An explicit `storageKey: null` keeps everything in memory.
- A `storageRef` must be reactive (another util's return or a
  getter/setter pair) for changes to propagate.
- The sync effect disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse's deprecated `emitAuto` is dropped: read `store` when the raw
  `'auto'` selection matters.
- The storage key defaults to `'sv-color-scheme'` (matching this
  library's `useDark`) rather than `'vueuse-color-scheme'`.
- `value`/`store` are getter/setter pairs rather than Vue refs, so
  `mode.value` reads and `mode.value = x` writes stay reactive with the
  same call shape.
- Custom `Storage` backends plug into the shared `useStorage`
  primitive, which this feature newly exports for reuse.
