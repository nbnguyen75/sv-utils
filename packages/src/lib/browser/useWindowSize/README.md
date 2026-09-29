# `useWindowSize`

Reactive window dimensions with scrollbar/viewport source options.
Inspired by [VueUse `useWindowSize`](https://vueuse.org/core/useWindowSize/).

## Signature

```ts
import { useWindowSize } from 'sv-utils';

const { width, height } = useWindowSize();
const outer = useWindowSize({ type: 'outer' });
```

## Options

| Parameter           | Type                             | Default    | Description                                                                           |
| ------------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `initialWidth`      | `number`                         | `Infinity` | Server and pre-mount width.                                                           |
| `initialHeight`     | `number`                         | `Infinity` | Server and pre-mount height.                                                          |
| `listenOrientation` | `boolean`                        | `true`     | Refresh on orientation changes (media query).                                         |
| `includeScrollbar`  | `boolean`                        | `true`     | Use inner dims (with scrollbar); else document client size. Only for `type: 'inner'`. |
| `type`              | `'inner' \| 'outer' \| 'visual'` | `'inner'`  | Dimension source (`visual` falls back to inner without `visualViewport`).             |

## Returns

| Field    | Type     | Reactive | Description             |
| -------- | -------- | -------- | ----------------------- |
| `width`  | `number` | getter   | Viewport/window width.  |
| `height` | `number` | getter   | Viewport/window height. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useWindowSize } from 'sv-utils';

	const { width } = useWindowSize();
</script>

{#if width < 768}
	<MobileNav />
{:else}
	<DesktopNav />
{/if}
```

### SSR behavior

Renders the initials (`Infinity` by default — pick concrete numbers to
avoid hydration mismatch) and measures on mount. Must be called in
component initialization.

## Edge cases & cleanup

- Orientation refreshes only re-measure on actual flips (compare-and-update,
  no redundant writes).
- Listeners (resize, visual-viewport, orientation query) dispose on unmount.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same sources/options; no `window` option (global scope only, per
  isomorphic rule). Prefer `useBreakpoints` for named responsive tiers.
