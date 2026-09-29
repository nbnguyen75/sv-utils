# `useElementBounding`

Reactive element bounding box, refreshed on layout changes.
Inspired by [VueUse `useElementBounding`](https://vueuse.org/core/useElementBounding/).

## Signature

```ts
import { useElementBounding } from 'sv-utils';

const { top, left, width, height, update } = useElementBounding(() => card);
update(); // re-measure now
```

## Options

| Parameter      | Type                     | Default    | Description                                                       |
| -------------- | ------------------------ | ---------- | ----------------------------------------------------------------- |
| `target`       | `MaybeElement`           | (required) | Element or getter (e.g. `bind:this` state).                       |
| `reset`        | `boolean`                | `true`     | Zero all values on unmount (and on target loss).                  |
| `windowResize` | `boolean`                | `true`     | Re-measure on window resize.                                      |
| `windowScroll` | `boolean`                | `true`     | Re-measure on window scroll (captured).                           |
| `immediate`    | `boolean`                | `true`     | Measure on mount.                                                 |
| `updateTiming` | `'sync' \| 'next-frame'` | `'sync'`   | Defer measurement a frame (for layouts settling after this tick). |

## Returns

| Field                                                  | Type         | Reactive | Description                     |
| ------------------------------------------------------ | ------------ | -------- | ------------------------------- |
| `height` `bottom` `left` `right` `top` `width` `x` `y` | `number`     | getters  | Rect fields (destructure-safe). |
| `update`                                               | `() => void` | method   | Re-measure now (honors timing). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useElementBounding } from 'sv-utils';

	let card: HTMLElement | null = null;
	const box = useElementBounding(() => card);
</script>

<div bind:this={card}>Top: {Math.round(box.top)}px</div>
```

### SSR behavior

All zeros on the server; measures on mount (when `immediate`). Must be
called in component initialization.

## Edge cases & cleanup

- Refreshes on resize observations, `style`/`class` mutations, window
  scroll/resize, target swaps, and manual `update()`.
- Without `requestAnimationFrame`, `next-frame` falls back to sync.
- Unmount resets to zeros unless `reset: false`.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same triggers/options; target swaps additionally re-measure (upstream
  only handled removal). No `window` option.
