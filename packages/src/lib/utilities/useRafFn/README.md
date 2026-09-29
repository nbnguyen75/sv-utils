# `useRafFn`

`requestAnimationFrame` loop with pause/resume, FPS cap, and once mode.
Inspired by [VueUse `useRafFn`](https://vueuse.org/core/useRafFn/).

## Signature

```ts
import { useRafFn } from 'sv-utils';

const { isActive, pause, resume } = useRafFn(({ delta, timestamp }) => render(delta));
const once = useRafFn(measure, { once: true });
const capped = useRafFn(poll, { fpsLimit: 10 });
```

## Options

| Parameter   | Type                             | Default    | Description                                                 |
| ----------- | -------------------------------- | ---------- | ----------------------------------------------------------- |
| `fn`        | `({ delta, timestamp }) => void` | (required) | Frame callback.                                             |
| `immediate` | `boolean`                        | `true`     | Start on mount (only where `requestAnimationFrame` exists). |
| `fpsLimit`  | `MaybeGetter<number \| null>`    | `null`     | Max frames/second; getters resolve per frame.               |
| `once`      | `boolean`                        | `false`    | Stop after the first executed frame.                        |

`delta` is ms since the previous executed frame (`0` on the first);
`timestamp` is the frame timestamp.

## Returns

| Field      | Type         | Reactive | Description                                   |
| ---------- | ------------ | -------- | --------------------------------------------- |
| `isActive` | `boolean`    | getter   | Whether the loop runs (destructure-safe).     |
| `pause`    | `() => void` | method   | Stop; safe repeated / when idle.              |
| `resume`   | `() => void` | method   | Start; no-op without `requestAnimationFrame`. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useRafFn } from 'sv-utils';

	let x = $state(0);
	useRafFn(({ delta }) => {
		x += delta * 0.06;
	});
</script>

<div style:transform={`translateX(${x}px)`}>slide</div>
```

### SSR behavior

The loop never starts on the server (`isActive` stays `false`); no DOM or
timer access at import or creation. Must be called in component
initialization (disposal via `$effect`).

## Edge cases & cleanup

- A capped first frame (delta `0` under budget) is skipped like any other
  over-budget frame (VueUse parity).
- `pause()` cancels the scheduled frame; unmount disposal is automatic.
- `resume()` resets the delta baseline so no time jump leaks in.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- No `window` option (VueUse's `ConfigurableWindow`): the global loop is
  used; iframe-window loops are out of scope.
