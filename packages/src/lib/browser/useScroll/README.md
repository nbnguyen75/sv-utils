# `useScroll`

Reactive scroll position, edge arrival, and directions for an element,
window, or document.
Inspired by [VueUse `useScroll`](https://vueuse.org/core/useScroll/).

## Signature

```ts
import { useScroll } from 'sv-utils';

const scroll = useScroll(() => panel, { offset: { bottom: 80 } });

scroll.y; // current scrollTop
scroll.y = 0; // scroll to top
```

## Options

| Option                 | Type                                 | Default                             | Description                                                                |
| ---------------------- | ------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------- |
| `throttle`             | `number`                             | `0`                                 | Throttle scroll handling in ms (`0` disables).                             |
| `idle`                 | `number`                             | `200`                               | Quiet period after the last event before scroll end (added to `throttle`). |
| `offset`               | `{ left?, right?, top?, bottom? }`   | `{}`                                | Edge arrival slack in pixels.                                              |
| `observe`              | `boolean \| { mutation?: boolean }`  | `false`                             | Observe DOM mutations and re-measure (`true` shorthand supported).         |
| `onScroll`             | `(event: Event) => void`             | no-op                               | Called on every (possibly throttled) scroll event.                         |
| `onStop`               | `(event: Event) => void`             | no-op                               | Called when scrolling ends.                                                |
| `eventListenerOptions` | `boolean \| AddEventListenerOptions` | `{ capture: false, passive: true }` | Listener options for the scroll event.                                     |
| `behavior`             | `MaybeGetter<ScrollBehavior>`        | `'auto'`                            | Scroll behavior for programmatic `x`/`y` writes.                           |
| `onError`              | `(error: unknown) => void`           | `console.error`                     | Called when a programmatic `scrollTo` throws.                              |

`ScrollTarget` is `HTMLElement | SVGElement | Window | Document | null | undefined`.

## Returns

| Field          | Type                 | Reactive      | Description                                            |
| -------------- | -------------------- | ------------- | ------------------------------------------------------ |
| `x`            | `number`             | getter/setter | Horizontal position; assigning scrolls.                |
| `y`            | `number`             | getter/setter | Vertical position; assigning scrolls.                  |
| `isScrolling`  | `boolean`            | getter        | Whether a scroll is in flight.                         |
| `arrivedState` | `ScrollArrivedState` | getter        | Edge arrival flags (`left`, `right`, `top`, `bottom`). |
| `directions`   | `ScrollDirections`   | getter        | Current scroll directions (all `false` at rest).       |
| `measure()`    | `() => void`         | method        | Re-measure now.                                        |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useScroll } from 'sv-utils';

	let panel = $state<HTMLDivElement | null>(null);
	const { y, arrivedState, directions } = useScroll(() => panel);
</script>

<div bind:this={panel} style="overflow: auto; height: 12rem">
	<p>Scrolled {y}px</p>
</div>
<p>top: {arrivedState.top}, scrolling down: {directions.bottom}</p>
```

### Programmatic scrolling

```svelte
<script lang="ts">
	import { useScroll } from 'sv-utils';

	const scroll = useScroll(() => document.body, { behavior: 'smooth' });

	function backToTop() {
		scroll.y = 0; // x stays put
	}
</script>

<button onclick={backToTop}>Back to top</button>
```

### SSR behavior

On the server the target getter returns nothing, so `x`/`y` stay `0`,
`arrivedState` starts at `left: true, top: true`, and no listener or
observer is attached. Values are measured on the client on mount, so
avoid rendering measurement-dependent text in the server HTML.

## Edge cases & cleanup

- `x`/`y` writes call `scrollTo`, which no-ops in SSR, and `onError`
  reports a rejected `scrollTo` promise instead of throwing.
- Scroll-end detection is deduped with both a timer (when `throttle` is
  set) and the native `scrollend` event when the browser supports it.
- Arrival uses a 1px tolerance, because sub-pixel rounding makes exact
  edge comparison unreliable. RTL and `flex-direction: row-reverse`
  containers are accounted for.
- Container kinds are duck-typed (`nodeType === 9` for `Document`,
  structural `scrollX` check for `Window`) so cross-realm targets work.
- Listeners, timers, and optional observers dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `behavior` is a `MaybeGetter`, so it can be switched at runtime.
- `arrivedState`/`directions` are exposed as getters, so destructuring
  stays reactive; VueUse's `Ref` is replaced by plain reactive fields.
- `x`/`y` are writable accessor properties, matching VueUse's writable
  computed refs without requiring a ref object.
