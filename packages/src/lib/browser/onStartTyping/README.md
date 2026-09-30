# `onStartTyping`

Fire a callback when the user starts typing while no editable element
is focused — the classic "press any key to search" hook.
Inspired by [VueUse `onStartTyping`](https://vueuse.org/core/onStartTyping/).

## Signature

```ts
import { onStartTyping } from 'sv-utils';

const stop = onStartTyping((event) => {
	search.focus();
});
```

## Options

| Option                     | Type                                | Default               | Description                               |
| -------------------------- | ----------------------------------- | --------------------- | ----------------------------------------- |
| `document`                 | `Document \| null`                  | `document`            | Document receiving keys; `null` disables. |
| `isTypedCharValid`         | `(event: KeyboardEvent) => boolean` | A–Z/0–9, no modifiers | Custom typeable-character check.          |
| `isFocusedElementEditable` | `() => boolean`                     | focus inspection      | Custom editable-focus check.              |

## Returns

A `stop()` function. Stopping silences the listener; disposal cleans
up regardless.

## Helpers

`isFocusedElementEditable()` and `isTypedCharValid(event)` are exported
for reuse and unit testing. Both are SSR-safe (`false` without a DOM
for the former; the latter is pure).

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { onStartTyping } from 'sv-utils';

	let search = $state<HTMLInputElement | null>(null);

	onStartTyping(() => search?.focus());
</script>

<input bind:this={search} placeholder="Press any key…" />
```

### Custom trigger key

```ts
onStartTyping(() => openPalette(), {
	isTypedCharValid: (event) => event.key === '/'
});
```

### SSR behavior

Without a DOM the call returns a stop function and listens to nothing.

## Edge cases & cleanup

- Typing inside `<input>`, `<textarea>`, or `contenteditable` never
  fires — only "unfocused" typing counts.
- Modified keystrokes (Ctrl/Meta/Alt held) are not typeable by default,
  so shortcuts don't trigger the callback.
- `stop()` silences permanently; the listener disposes with the
  component.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- VueUse returns nothing; this port returns a silencing `stop()` for
  symmetry with the other `on*` utilities. The callback and option
  semantics are unchanged.
