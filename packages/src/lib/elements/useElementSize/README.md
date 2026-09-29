# `useElementSize`

Reactive element dimensions via `ResizeObserver`, with mount measuring.
Inspired by [VueUse `useElementSize`](https://vueuse.org/core/useElementSize/).

## Signature

```ts
import { useElementSize } from 'sv-utils';

const { width, height, stop } = useElementSize(() => panel);
```

## Options

| Parameter     | Type                                                          | Default         | Description                                 |
| ------------- | ------------------------------------------------------------- | --------------- | ------------------------------------------- |
| `target`      | `MaybeElement`                                                | (required)      | Element or getter (e.g. `bind:this` state). |
| `initialSize` | `{ width: number; height: number }`                           | `{0, 0}`        | Server and pre-mount dimensions.            |
| `box`         | `'content-box' \| 'border-box' \| 'device-pixel-content-box'` | `'content-box'` | Box model to measure.                       |

## Returns

| Field    | Type         | Reactive | Description                          |
| -------- | ------------ | -------- | ------------------------------------ |
| `width`  | `number`     | getter   | Measured width (destructure-safe).   |
| `height` | `number`     | getter   | Measured height (destructure-safe).  |
| `stop`   | `() => void` | method   | Disconnect the observer permanently. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useElementSize } from 'sv-utils';

	let panel: HTMLElement | null = null;
	const { width } = useElementSize(() => panel);
</script>

<div bind:this={panel}>Width: {Math.round(width)}px</div>
```

### SSR behavior

Reports `initialSize` on the server; measures on mount. Must be called in
component initialization.

## Edge cases & cleanup

- SVG elements measure via `getBoundingClientRect` (no box model).
- Missing box sizes fall back to `contentRect`; non-finite measurements
  (layout-less environments) keep the previous value instead of NaN.
- Target swaps reset to `initialSize` (or zeros without a target).
- `stop()` disconnects; unmount disposal is automatic.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same box modes and mount measuring; no `window` option (global scope
  only).
