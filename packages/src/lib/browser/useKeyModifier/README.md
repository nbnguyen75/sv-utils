# `useKeyModifier`

Track whether a modifier key is currently held down.
Inspired by [VueUse `useKeyModifier`](https://vueuse.org/core/useKeyModifier/).

## Signature

```ts
import { useKeyModifier } from 'sv-utils';

const shift = useKeyModifier('Shift', { initial: false });
shift.value; // true while Shift is held
```

## Options

| Option     | Type                                                      | Default    | Description                                           |
| ---------- | --------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| `events`   | `Array<'mousedown' \| 'mouseup' \| 'keydown' \| 'keyup'>` | all four   | Events that refresh the state.                        |
| `document` | `Document \| null`                                        | `document` | Document receiving events; `null` disables listening. |
| `initial`  | `boolean \| null`                                         | `null`     | Starting value.                                       |

## Returns

`{ readonly value }`: `boolean` when `initial` is a boolean, otherwise
`boolean | null` (`null` until the first event).

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useKeyModifier } from 'sv-utils';

	const shift = useKeyModifier('Shift', { initial: false });
</script>

<p>Shift held: {shift.value}</p>
```

### Click-with-modifier

```ts
const control = useKeyModifier('Control');

function onClick() {
	if (control.value) openInBackgroundTab();
	else navigate();
}
```

### SSR behavior

Without a DOM the value stays at `initial` and nothing is observed.

## Edge cases & cleanup

- The state refreshes from `getModifierState` on every configured
  event, so it stays correct even when the key changes while the page
  has no focus between events.
- An explicit `document: null` disables listening entirely — it does
  not fall back to the global document.
- All listeners are `passive` and dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse returns the ref directly; this port returns a getter-backed
  `{ value }` object, so `modifier.value` reads identically and
  destructuring stays reactive.
- The non-null refined return for boolean initials is preserved through
  overloads rather than a conditional ref type.
