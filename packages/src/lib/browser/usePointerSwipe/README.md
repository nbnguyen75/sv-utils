# `usePointerSwipe`

Reactive swipe detection based on PointerEvents (mouse, touch, and pen).
Inspired by [VueUse `usePointerSwipe`](https://vueuse.org/core/usePointerSwipe/).

## Signature

```ts
import { usePointerSwipe } from 'sv-utils';

const { direction, distanceX } = usePointerSwipe(() => card, { threshold: 30 });
```

## Options

| Option              | Type                                                          | Default          | Description                                             |
| ------------------- | ------------------------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `threshold`         | `number`                                                      | `50`             | Minimum travel (px) before a swipe counts.              |
| `pointerTypes`      | `PointerType[]`                                               | all held buttons | Only track these kinds (`'mouse'`, `'pen'`, `'touch'`). |
| `disableTextSelect` | `boolean`                                                     | `false`          | Set `user-select: none` on the target.                  |
| `onSwipeStart`      | `(event: PointerEvent) => void`                               | —                | Called on swipe start.                                  |
| `onSwipe`           | `(event: PointerEvent) => void`                               | —                | Called on swipe moves.                                  |
| `onSwipeEnd`        | `(event: PointerEvent, direction: UseSwipeDirection) => void` | —                | Called on swipe end.                                    |

## Returns

| Field       | Type                | Reactive | Description                                         |
| ----------- | ------------------- | -------- | --------------------------------------------------- |
| `isSwiping` | `boolean`           | getter   | Whether a swipe is in progress.                     |
| `direction` | `UseSwipeDirection` | getter   | `'up' \| 'down' \| 'left' \| 'right'`, or `'none'`. |
| `posStart`  | `SwipePosition`     | getter   | Press-start coordinates (read-only by contract).    |
| `posEnd`    | `SwipePosition`     | getter   | Latest coordinates (read-only by contract).         |
| `distanceX` | `number`            | getter   | Horizontal travel (`start − end`).                  |
| `distanceY` | `number`            | getter   | Vertical travel (`start − end`).                    |
| `stop()`    | `() => void`        | method   | Silence the instance permanently.                   |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePointerSwipe } from 'sv-utils';

	let card = $state<HTMLDivElement | null>(null);
	const { direction } = usePointerSwipe(() => card);
</script>

<div bind:this={card}>Swipe me: {direction}</div>
```

### Drag-to-dismiss

```ts
const { distanceX, isSwiping } = usePointerSwipe(() => sheet, {
	threshold: 24,
	onSwipeEnd: (_event, direction) => {
		if (direction === 'down') close();
	}
});
```

### SSR behavior

Listeners and target styling apply only in the browser. On the server
`isSwiping` is `false`, `direction` is `'none'`, and positions stay at
origin.

## Edge cases & cleanup

- Moves without a preceding press are ignored; a press alone (no travel)
  produces no swipe and no end callback.
- Pointer capture is requested on press so the gesture survives leaving
  the element; capture failures are swallowed as best-effort.
- The target gets `touch-action: pan-y` on mount, keeping vertical page
  scroll working while horizontal swipes are tracked.
- Without `pointerTypes`, any held primary button (or a button release)
  is accepted; with the option set, only listed kinds count.
- `stop()` silences the instance permanently; listeners and styles
  dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `distanceX`/`distanceY` are `start − end` signed distances, matching
  VueUse's semantics.
- `UseSwipeDirection`, `SwipePosition`, and `PointerType` are shared with
  `useSwipe`/`usePointer` by type import; each is exported once, from its
  home module, so the barrel stays unambiguous.
