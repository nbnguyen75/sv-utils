# `useFps`

Reactive frames-per-second meter over `requestAnimationFrame`.
Inspired by [VueUse `useFps`](https://vueuse.org/core/useFps/).

## Signature

```ts
import { useFps } from 'sv-utils';

const fps = useFps();
fps.value; // 0 until the first sample window completes
```

## Options

| Parameter | Type     | Default | Description                           |
| --------- | -------- | ------- | ------------------------------------- |
| `every`   | `number` | `10`    | Recompute the average every N frames. |

## Returns

| Field   | Type     | Reactive | Description                             |
| ------- | -------- | -------- | --------------------------------------- |
| `value` | `number` | getter   | Latest measured FPS (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useFps } from 'sv-utils';

	const fps = useFps();
</script>

<p>{fps.value} fps</p>
```

### SSR behavior

Returns `0` where `performance` is unavailable (including SSR) without
starting any loop. Otherwise samples from mount; safe with or without
SvelteKit.

## Edge cases & cleanup

- The sampling loop (via `useRafFn`) disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`
  transitively).

## Parity notes

- Same `every`-window averaging; returns a getter object instead of a ref.
