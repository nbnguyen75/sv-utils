# `useMouseInElement`

Track the pointer position relative to an element's bounding box.
Inspired by [VueUse `useMouseInElement`](https://vueuse.org/core/useMouseInElement/).

## Signature

```ts
import { useMouseInElement } from 'sv-utils';

const { elementX, elementY, isOutside } = useMouseInElement(() => card);
```

## Options

Extends every [`useMouse`](../useMouse/README.md) option (`type`,
`target`, `touch`, `scroll`, `resetOnTouchEnds`, `initialValue`) plus:

| Option          | Type      | Default | Description                                            |
| --------------- | --------- | ------- | ------------------------------------------------------ |
| `handleOutside` | `boolean` | `true`  | Keep reporting coordinates outside the element bounds. |
| `windowScroll`  | `boolean` | `true`  | Refresh on window scroll.                              |
| `windowResize`  | `boolean` | `true`  | Refresh on window resize.                              |

The first positional argument is the element (or getter); omitting it
tracks `document.body`.

## Returns

| Field              | Type                         | Reactive | Description                                     |
| ------------------ | ---------------------------- | -------- | ----------------------------------------------- |
| `x`, `y`           | `number`                     | getter   | Global pointer position (from `useMouse`).      |
| `sourceType`       | `'mouse' \| 'touch' \| null` | getter   | Latest input kind.                              |
| `elementX`         | `number`                     | getter   | X relative to the element.                      |
| `elementY`         | `number`                     | getter   | Y relative to the element.                      |
| `elementPositionX` | `number`                     | getter   | Element's page X.                               |
| `elementPositionY` | `number`                     | getter   | Element's page Y.                               |
| `elementHeight`    | `number`                     | getter   | Element height.                                 |
| `elementWidth`     | `number`                     | getter   | Element width.                                  |
| `isOutside`        | `boolean`                    | getter   | Whether the pointer sits outside the element.   |
| `stop()`           | `() => void`                 | method   | Detach all observers and listeners permanently. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useMouseInElement } from 'sv-utils';

	let card = $state<HTMLDivElement | null>(null);
	const { elementX, elementY, isOutside } = useMouseInElement(() => card);
</script>

<div bind:this={card} style="width: 200px; height: 120px">
	{isOutside ? 'outside' : `${elementX}, ${elementY}`}
</div>
```

### Freezing coordinates while outside

```ts
const { elementX, elementY, isOutside } = useMouseInElement(() => card, {
	handleOutside: false
});
// elementX/elementY keep their last in-bounds values once the pointer leaves
```

### SSR behavior

`document.body` is only read inside browser-guarded code, so on the
server all fields report their `0`/`true` initial values and no
observers or listeners are created.

## Edge cases & cleanup

- All client rects are walked (not just the bounding box), so an element
  with `flex-wrap` or inline children is treated as "inside" on any of
  its fragments.
- A zero-width or zero-height rect counts as outside, which prevents
  coordinates from latching onto hidden elements.
- `ResizeObserver` and `MutationObserver` (`style`/`class` filters) keep
  coordinates correct when the element resizes or its layout class
  changes. A `mouseleave` on `document` marks the pointer outside.
- `stop()` detaches the observers early; disposal would do it anyway, so
  use it only for long-lived instances.
- Calculation reads and writes distinct signals (locals only), avoiding
  the effect read/write aliasing re-trigger loop.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `elementX`/`elementY` are `0`-based inside the element, not
  center-relative, matching VueUse.
- The extra `stop()` method is an addition, not a divergence.
