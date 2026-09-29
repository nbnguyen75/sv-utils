# `useFullscreen`

Reactive Fullscreen API with vendor-prefix fallbacks.
Inspired by [VueUse `useFullscreen`](https://vueuse.org/core/useFullscreen/).

## Signature

```ts
import { useFullscreen } from 'sv-utils';

const { isSupported, isFullscreen, enter, exit, toggle } = useFullscreen(() => player);
await toggle();
```

## Options

| Parameter  | Type           | Default          | Description                                  |
| ---------- | -------------- | ---------------- | -------------------------------------------- |
| `target`   | `MaybeElement` | document element | Element to present (or getter).              |
| `autoExit` | `boolean`      | `false`          | Exit fullscreen when the component unmounts. |

## Returns

| Field          | Type                  | Reactive | Description                                            |
| -------------- | --------------------- | -------- | ------------------------------------------------------ |
| `isSupported`  | `boolean`             | getter   | Fullscreen API available here (always `false` on SSR). |
| `isFullscreen` | `boolean`             | getter   | Target currently fullscreen (destructure-safe).        |
| `enter`        | `() => Promise<void>` | method   | Enter (no-op when unsupported/already fullscreen).     |
| `exit`         | `() => Promise<void>` | method   | Exit (no-op when unsupported/not fullscreen).          |
| `toggle`       | `() => Promise<void>` | method   | Switch between the two.                                |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useFullscreen } from 'sv-utils';

	let player: HTMLElement | null = null;
	const screen = useFullscreen(() => player);
</script>

<div bind:this={player}>
	<button onclick={() => screen.toggle()}>
		{screen.isFullscreen ? 'Exit' : 'Enter'} fullscreen
	</button>
</div>
```

### SSR behavior

Reports unsupported with `isFullscreen: false` on the server; every
control safely no-ops. Must be called in component initialization.

## Edge cases & cleanup

- Vendor prefixes (`webkit`/`moz`/`ms`) detected via capability probing
  (`in` operator — no `any` casts); syncs from all change event variants.
- `enter()` while another element is fullscreen exits it first, then
  presents the target (upstream order).
- Listeners dispose on unmount; `autoExit` additionally exits then.
- Must be called in component initialization (uses `$state` / `$derived` /
  `$effect`).

## Parity notes

- Same state machine and fallbacks; no `document` option (global scope
  only).
