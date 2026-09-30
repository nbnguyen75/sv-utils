# `onLongPress`

Fire a handler when an element is pressed and held past a delay.
Inspired by [VueUse `onLongPress`](https://vueuse.org/core/onLongPress/).

## Signature

```ts
import { onLongPress } from 'sv-utils';

const stop = onLongPress(
	() => button,
	() => openContextMenu(),
	{ delay: 400 }
);
```

## Options

| Option              | Type                                               | Default | Description                                           |
| ------------------- | -------------------------------------------------- | ------- | ----------------------------------------------------- |
| `delay`             | `number \| ((event: PointerEvent) => number)`      | `500`   | Milliseconds until the handler fires.                 |
| `modifiers`         | `OnLongPressModifiers`                             | —       | `stop`, `once`, `prevent`, `capture`, `self`.         |
| `distanceThreshold` | `number \| false`                                  | `10`    | Cancel when drifting this far (px); `false` disables. |
| `onMouseUp`         | `(duration, distance, isLongPress, event) => void` | —       | Called on release with press measurements.            |

## Returns

A `stop()` function. Stopping also cancels a pending timer.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { onLongPress } from 'sv-utils';

	let button = $state<HTMLButtonElement | null>(null);

	onLongPress(
		() => button,
		() => console.log('held!'),
		{ delay: 400 }
	);
</script>

<button bind:this={button}>Hold me</button>
```

### Distinguishing taps from holds

```ts
onLongPress(
	() => button,
	() => openMenu(),
	{
		delay: 350,
		onMouseUp: (_duration, _distance, isLongPress) => {
			if (!isLongPress) activate();
		}
	}
);
```

### SSR behavior

Listeners and timers are created only in the browser. On the server the
call returns a stop function and nothing else happens.

## Edge cases & cleanup

- Releasing before the delay fires no handler; `onMouseUp` still
  reports the press with `isLongPress: false`.
- Drifting past `distanceThreshold` cancels silently (no `onMouseUp`
  either, since the press is discarded — matching upstream).
- `stop()` cancels a pending timer, so the handler cannot fire after
  stopping. A pending timer is also cleared on unmount, so user code
  never runs after disposal.
- `self: true` restricts handling to events targeting the element
  itself, ignoring presses that start on children.
- `once: true` passes through to the native listener options.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Upstream's `stop()` leaves a pending timer armed; this port cancels
  it, because a post-stop (or post-unmount) handler invocation can
  write to disposed component state. The stricter behavior is
  intentional and documented here.
