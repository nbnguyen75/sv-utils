# `useMouse`

Track the pointer position in a selectable coordinate system.
Inspired by [VueUse `useMouse`](https://vueuse.org/core/useMouse/).

## Signature

```ts
import { useMouse } from 'sv-utils';

const { x, y, sourceType } = useMouse({ type: 'client' });
```

## Options

| Option             | Type                                                                     | Default          | Description                                                  |
| ------------------ | ------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------ |
| `type`             | `'page' \| 'client' \| 'screen' \| 'movement' \| UseMouseEventExtractor` | `'page'`         | Coordinate system, or a custom extractor returning `[x, y]`. |
| `target`           | `MaybeGetter<Window \| EventTarget \| null \| undefined>`                | `window`         | Element (or getter) listening for pointer events.            |
| `touch`            | `boolean`                                                                | `true`           | Listen to touch events.                                      |
| `scroll`           | `boolean`                                                                | `true`           | Adjust page coordinates on window scroll.                    |
| `resetOnTouchEnds` | `boolean`                                                                | `false`          | Reset to the initial value on `touchend`.                    |
| `initialValue`     | `{ x: number; y: number }`                                               | `{ x: 0, y: 0 }` | Initial coordinates.                                         |

`UseMouseCoordType` is the coordinate union;
`UseMouseEventExtractor` is `(event: MouseEvent | Touch) => [x, y] | null | undefined`;
`UseMouseSourceType` is `'mouse' | 'touch' | null`.

## Returns

| Field        | Type                 | Reactive | Description                               |
| ------------ | -------------------- | -------- | ----------------------------------------- |
| `x`          | `number`             | getter   | Horizontal position.                      |
| `y`          | `number`             | getter   | Vertical position.                        |
| `sourceType` | `UseMouseSourceType` | getter   | Which input produced the latest position. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useMouse } from 'sv-utils';

	const { x, y, sourceType } = useMouse();
</script>

<p>Pointer at {x}, {y} ({sourceType ?? 'idle'})</p>
```

### Constrained to one element

```svelte
<script lang="ts">
	import { useMouse } from 'sv-utils';

	let pad = $state<HTMLDivElement | null>(null);
	const { x, y } = useMouse({ target: () => pad, type: 'client' });
</script>

<div bind:this={pad}>{x} / {y}</div>
```

### Custom extractor

```ts
const { x, y } = useMouse({
	type: (event) => {
		const touch = event as Touch;
		return touch.identifier ? [touch.clientX, touch.clientY] : null;
	},
	touch: true
});
```

### SSR behavior

All listeners are registered inside an `isBrowser` guard, so on the
server `x`/`y` stay at `initialValue` and `sourceType` stays `null`.

## Edge cases & cleanup

- `mousemove` and `dragover` both update the position, so dragging keeps
  tracking. Listeners are `passive`.
- `type: 'movement'` yields per-event deltas, not absolute positions;
  touch listeners are skipped in that mode because deltas are undefined.
- With `type: 'page'` and `scroll: true`, the last event's coordinates
  are corrected by the window scroll delta, so the reported position
  stays put in document space while the page moves under a fixed cursor.
- `resetOnTouchEnds` returns the state to `initialValue` on `touchend`
  (not the first touch's coordinates), which avoids a stale jump.
- An extractor returning `null` is ignored, so the previous position is
  kept rather than zeroed.
- All listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `type` accepts a custom extractor function, matching VueUse's
  `UseMouseEventExtractor` escape hatch.
- VueUse's `Ref` values are replaced by getter-backed fields, so
  destructuring `{ x, y }` stays reactive.
