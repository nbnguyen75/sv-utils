# `useElementByPoint`

Reactive element lookup by viewport point, refreshed on a scheduler.
Inspired by [VueUse `useElementByPoint`](https://vueuse.org/useElementByPoint/).

## Signature

```ts
import { useElementByPoint } from 'sv-utils';

const hit = useElementByPoint({ x: () => pointer.x, y: () => pointer.y });
hit.element; // topmost element under the pointer
```

## Options

| Option      | Type                                             | Default    | Description                                                                 |
| ----------- | ------------------------------------------------ | ---------- | --------------------------------------------------------------------------- |
| `x`         | `MaybeGetter<number>`                            | —          | Viewport X to query.                                                        |
| `y`         | `MaybeGetter<number>`                            | —          | Viewport Y to query.                                                        |
| `multiple`  | `MaybeGetter<boolean>`                           | `false`    | Return the full hit stack (`elementsFromPoint`). Resolved once at creation. |
| `scheduler` | `(fn: () => void) => UseElementByPointScheduler` | `useRafFn` | Drives re-queries.                                                          |

## Returns

| Field         | Type                                                       | Reactive | Description                              |
| ------------- | ---------------------------------------------------------- | -------- | ---------------------------------------- |
| `isSupported` | `boolean`                                                  | static   | Whether the hit-testing API exists here. |
| `element`     | `HTMLElement \| null` (or `HTMLElement[]` with `multiple`) | getter   | Hit element(s) at the point.             |
| `isActive`    | `boolean`                                                  | getter   | Whether the query loop is running.       |
| `pause()`     | `() => void`                                               | method   | Suspend querying.                        |
| `resume()`    | `() => void`                                               | method   | Resume querying.                         |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useElementByPoint, useMouse } from 'sv-utils';

	const { x, y } = useMouse();
	const hit = useElementByPoint({ x: () => x, y: () => y });
</script>

<p>Under the pointer: {hit.element?.tagName ?? 'nothing'}</p>
```

### Hit stack

```ts
const stack = useElementByPoint({ x: 120, y: 80, multiple: true });
stack.element; // [overlay, card, body, ...]
```

### SSR behavior

Without a DOM, `isSupported` is `false`, `element` stays `null`, and no
scheduler runs.

## Edge cases & cleanup

- When the API is absent, the scheduler callback is a guarded no-op, so
  the instance is inert rather than throwing per frame.
- `multiple` and `isSupported` are resolved once at creation; flipping
  them later has no effect (matching upstream, where the support check
  runs at setup).
- The default `useRafFn` scheduler is a no-op without
  `requestAnimationFrame`; pass a custom scheduler (interval, manual) in
  constrained environments.
- The scheduler disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Returned elements are typed `HTMLElement`, matching upstream (SVG
  elements may actually arrive; narrow at the call site if it matters).
- VueUse's `Pausable` spread is spelled out here as
  `isActive`/`pause`/`resume` so the surface is explicit in the `.d.ts`.
