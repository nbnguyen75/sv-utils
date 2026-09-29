# `useMousePressed`

Track whether any mouse button, touch, or drag is currently held down.
Inspired by [VueUse `useMousePressed`](https://vueuse.org/core/useMousePressed/).

## Signature

```ts
import { useMousePressed } from 'sv-utils';

const { pressed, sourceType } = useMousePressed({ target: () => button });
```

## Options

| Option         | Type                                                     | Default  | Description                                      |
| -------------- | -------------------------------------------------------- | -------- | ------------------------------------------------ |
| `touch`        | `boolean`                                                | `true`   | Listen to `touchstart`/`touchend`/`touchcancel`. |
| `drag`         | `boolean`                                                | `true`   | Listen to `dragstart`/`drop`/`dragend`.          |
| `capture`      | `boolean`                                                | `false`  | Register listeners in the capture phase.         |
| `initialValue` | `boolean`                                                | `false`  | Starting pressed state.                          |
| `target`       | `MaybeElement`                                           | `window` | Element (or getter) receiving press starts.      |
| `onPressed`    | `(event: MouseEvent \| TouchEvent \| DragEvent) => void` | —        | Called when pressing starts.                     |
| `onReleased`   | `(event: MouseEvent \| TouchEvent \| DragEvent) => void` | —        | Called when pressing ends.                       |

## Returns

| Field        | Type                 | Reactive | Description                                          |
| ------------ | -------------------- | -------- | ---------------------------------------------------- |
| `pressed`    | `boolean`            | getter   | Whether anything is pressed.                         |
| `sourceType` | `UseMouseSourceType` | getter   | Latest input kind (`'mouse'`, `'touch'`, or `null`). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useMousePressed } from 'sv-utils';

	const { pressed } = useMousePressed();
</script>

<p>click and hold: {pressed}</p>
```

### Scoped to a button with callbacks

```svelte
<script lang="ts">
	import { useMousePressed } from 'sv-utils';

	let button = $state<HTMLButtonElement | null>(null);
	const { pressed } = useMousePressed({
		target: () => button,
		drag: false,
		onPressed: () => console.log('down'),
		onReleased: () => console.log('up')
	});
</script>

<button bind:this={button} aria-pressed={pressed}>Hold me</button>
```

### SSR behavior

No listeners are registered outside the browser, so `pressed` stays at
`initialValue` and `sourceType` stays `null` on the server.

## Edge cases & cleanup

- Press starts are scoped to `target`; releases always listen on
  `window`, so a release outside the target (or outside the viewport)
  still clears the state.
- `mouseleave` on `window` ends a press, so dragging off-screen does not
  leave the state stuck.
- `touchcancel` and `dragend` are treated as releases, matching browser
  behavior for interrupted gestures.
- Listeners are `passive`; use `capture` to observe presses stopped by
  child `stopPropagation` handlers.
- `initialValue: true` starts pressed without an event; useful when a
  gesture begins before the component mounts.
- All listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `drag` defaults to `true` here; VueUse's `drag` option also gates
  drag tracking, and the same flag set is exposed.
- `pressed` and `sourceType` are getter-backed rather than refs, so
  destructuring stays reactive.
