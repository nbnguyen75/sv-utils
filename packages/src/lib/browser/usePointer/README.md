# `usePointer`

Track the full pointer state: position, pressure, tilt, contact size, and
input kind.
Inspired by [VueUse `usePointer`](https://vueuse.org/core/usePointer/).

## Signature

```ts
import { usePointer } from 'sv-utils';

const pointer = usePointer();
pointer.x; // pointer clientX
```

## Options

| Option         | Type                                            | Default  | Description                                                            |
| -------------- | ----------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `pointerTypes` | `PointerType[]`                                 | all      | Only update position from these kinds (`'mouse'`, `'pen'`, `'touch'`). |
| `initialValue` | `MaybeGetter<Partial<UsePointerState>>`         | `{}`     | Starting state; resolved once at creation.                             |
| `target`       | `MaybeGetter<EventTarget \| null \| undefined>` | `window` | Element (or getter) receiving pointer events.                          |

## Returns

| Field         | Type                  | Reactive | Description                                       |
| ------------- | --------------------- | -------- | ------------------------------------------------- |
| `x`, `y`      | `number`              | getter   | Pointer client coordinates.                       |
| `pressure`    | `number`              | getter   | Pressure of the pointer input.                    |
| `pointerId`   | `number`              | getter   | Unique pointer identifier.                        |
| `tiltX`       | `number`              | getter   | Plane angle (degrees) between pointer and screen. |
| `tiltY`       | `number`              | getter   | Plane angle (degrees) between pointer and screen. |
| `width`       | `number`              | getter   | Contact width on the X axis.                      |
| `height`      | `number`              | getter   | Contact height on the Y axis.                     |
| `twist`       | `number`              | getter   | Clockwise transducer rotation (0–359).            |
| `pointerType` | `PointerType \| null` | getter   | Latest input kind.                                |
| `isInside`    | `boolean`             | getter   | Whether the pointer is over the target.           |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePointer } from 'sv-utils';

	const { x, y, pressure } = usePointer();
</script>

<p>
	Pointer at {x}, {y} (pressure {pressure})
</p>
```

### Pen-only drawing surface

```svelte
<script lang="ts">
	import { usePointer } from 'sv-utils';

	let canvas = $state<HTMLCanvasElement | null>(null);
	const pointer = usePointer({ target: () => canvas, pointerTypes: ['pen'] });
</script>

<canvas bind:this={canvas}></canvas>
```

### SSR behavior

No listeners are registered outside the browser, so every field reports
its default (`0` / `null` / `false`) on the server.

## Edge cases & cleanup

- `pointerdown`, `pointermove`, and `pointerup` all update the state, so
  drags keep tracking without a separate press API. Listeners are
  `passive`.
- A filtered-out pointer type still marks `isInside` but leaves the
  position frozen, so presence and position stay independent signals.
- `pointerleave` and `pointercancel` clear `isInside` without touching
  the last known position.
- All listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `initialValue` accepts a getter (resolved once at creation); VueUse
  takes a `MaybeRef` with the same one-shot semantics.
- The ten state fields are getter-backed rather than refs, so
  destructuring stays reactive.
