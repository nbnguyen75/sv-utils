# `useSwipe`

Reactive touch-swipe detection with direction and travel distance.
Inspired by [VueUse `useSwipe`](https://vueuse.org/core/useSwipe/).

## Signature

```ts
import { useSwipe } from 'sv-utils';

const { direction, isSwiping } = useSwipe(() => gallery);
```

## Options

| Option         | Type                                                        | Default | Description                                             |
| -------------- | ----------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `threshold`    | `number`                                                    | `50`    | Minimum travel (px) before a gesture counts as a swipe. |
| `passive`      | `boolean`                                                   | `true`  | Register events as passive.                             |
| `onSwipeStart` | `(event: TouchEvent) => void`                               | —       | Called on swipe start.                                  |
| `onSwipe`      | `(event: TouchEvent) => void`                               | —       | Called on swipe moves.                                  |
| `onSwipeEnd`   | `(event: TouchEvent, direction: UseSwipeDirection) => void` | —       | Called on swipe end.                                    |

## Returns

| Field         | Type                | Reactive | Description                                                             |
| ------------- | ------------------- | -------- | ----------------------------------------------------------------------- |
| `isSwiping`   | `boolean`           | getter   | Whether a swipe is in progress.                                         |
| `direction`   | `UseSwipeDirection` | getter   | `'up' \| 'down' \| 'left' \| 'right'`, or `'none'` below the threshold. |
| `coordsStart` | `SwipePosition`     | getter   | Touch-start coordinates (read-only by contract).                        |
| `coordsEnd`   | `SwipePosition`     | getter   | Latest touch coordinates (read-only by contract).                       |
| `lengthX`     | `number`            | getter   | Horizontal travel (`start − end`).                                      |
| `lengthY`     | `number`            | getter   | Vertical travel (`start − end`).                                        |
| `stop()`      | `() => void`        | method   | Silence the instance permanently.                                       |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useSwipe } from 'sv-utils';

	let gallery = $state<HTMLDivElement | null>(null);
	const { direction } = useSwipe(() => gallery);

	$effect(() => {
		if (direction === 'left') next();
		if (direction === 'right') previous();
	});
</script>

<div bind:this={gallery}>…</div>
```

### Carousel with callbacks

```ts
const { lengthX } = useSwipe(() => track, {
	threshold: 30,
	onSwipeEnd: (_event, direction) => {
		if (direction === 'left') next();
		if (direction === 'right') previous();
	}
});
```

### SSR behavior

Listeners are registered only in the browser. On the server `isSwiping`
is `false`, `direction` is `'none'`, and coordinates stay at origin.

## Edge cases & cleanup

- Only single-touch gestures are tracked; multi-touch `touchstart` /
  `touchmove` is ignored entirely.
- `onSwipeEnd` fires only when a swipe was actually in progress; a tap
  below the threshold produces no end callback.
- With `passive: false`, horizontal moves are `preventDefault()`-ed
  (capture phase), matching upstream's scroll-suppression behavior.
- `stop()` silences the instance permanently; the underlying listeners
  still dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `lengthX`/`lengthY` are `start − end` signed distances, matching
  VueUse's `diffX`/`diffY` semantics.
- The reactive fields are getter-backed rather than refs, so
  destructuring stays reactive.
