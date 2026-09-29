# `useIntersectionObserver`

`IntersectionObserver` wrapper with pause/resume/stop controls.
Inspired by [VueUse `useIntersectionObserver`](https://vueuse.org/core/useIntersectionObserver/).

## Signature

```ts
import { useIntersectionObserver } from 'sv-utils';

const { isActive, pause, resume, stop } = useIntersectionObserver(
	() => element,
	([entry]) => console.log(entry?.isIntersecting),
	{ threshold: 0.5 }
);
```

## Options

| Parameter    | Type                                                    | Default    | Description                                         |
| ------------ | ------------------------------------------------------- | ---------- | --------------------------------------------------- |
| `target`     | `MaybeElement \| MaybeElement[]`                        | (required) | Element(s) or getters; nullish entries skipped.     |
| `callback`   | `IntersectionObserverCallback`                          | (required) | Observer callback.                                  |
| `immediate`  | `boolean`                                               | `true`     | Start observing on mount.                           |
| `root`       | `MaybeGetter<Element \| Document \| null \| undefined>` | —          | Intersection root (getters re-resolve per rebuild). |
| `rootMargin` | `MaybeGetter<string \| undefined>`                      | —          | Root margin (getters re-resolve per rebuild).       |
| `threshold`  | `number \| number[]`                                    | `0`        | Ratio(s) triggering the callback.                   |

## Returns

| Field         | Type         | Reactive | Description                                                    |
| ------------- | ------------ | -------- | -------------------------------------------------------------- |
| `isSupported` | `boolean`    | const    | `IntersectionObserver` exists here (always `false` on SSR).    |
| `isActive`    | `boolean`    | getter   | Observation running (destructure-safe). Starts as `immediate`. |
| `pause`       | `() => void` | method   | Suspend (disconnects).                                         |
| `resume`      | `() => void` | method   | Resume (no-op after `stop`).                                   |
| `stop`        | `() => void` | method   | Stop permanently.                                              |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useIntersectionObserver } from 'sv-utils';

	let sentinel: HTMLElement | null = null;
	useIntersectionObserver(
		() => sentinel,
		([entry]) => {
			if (entry?.isIntersecting) loadMore();
		}
	);
</script>

<div bind:this={sentinel}></div>
```

### SSR behavior

Reports `isSupported: false` and never observes on the server. Must be
called in component initialization.

## Edge cases & cleanup

- Target/root/margin changes rebuild the observer (old one disconnects).
- `stop()` is permanent (`resume()` stays stopped); unmount disposal is
  automatic.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same controls semantics; no `window` option (global scope only).
