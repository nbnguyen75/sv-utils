# `useWindowScroll`

Reactive window scroll position, edge arrival, and directions.
Inspired by [VueUse `useWindowScroll`](https://vueuse.org/core/useWindowScroll/).

## Signature

```ts
import { useWindowScroll } from 'sv-utils';

const { x, y, arrivedState } = useWindowScroll();
```

## Options

Identical to [`useScroll`](../useScroll/README.md) — `throttle`, `idle`,
`offset`, `observe`, `onScroll`, `onStop`, `eventListenerOptions`,
`behavior`, `onError`. `UseWindowScrollOptions` is an alias of
`UseScrollOptions`, so every default documented there applies here.

## Returns

Identical to [`useScroll`](../useScroll/README.md) — `x`, `y`,
`isScrolling`, `arrivedState`, `directions`, `measure()`.
`UseWindowScrollReturn` is an alias of `UseScrollReturn`.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useWindowScroll } from 'sv-utils';

	const { y, arrivedState } = useWindowScroll({ throttle: 50 });
</script>

<p>Page offset: {y}px</p><p>At top: {arrivedState.top}</p>
```

### Back-to-top button

```svelte
<script lang="ts">
	import { useWindowScroll } from 'sv-utils';

	const scroll = useWindowScroll({ behavior: 'smooth' });
</script>

{#if !scroll.arrivedState.top}
	<button onclick={() => (scroll.y = 0)}>Top</button>
{/if}
```

### SSR behavior

The window target resolves to `undefined` during SSR, so `x`/`y` report
`0` and nothing is measured or listened to on the server. The first
client measurement happens on mount.

## Edge cases & cleanup

- The window scroll event fires on `document.documentElement`, matching
  the page scroll target browsers use.
- All scroll handling, timers, and listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Thin convenience wrapper over `useScroll(() => window)`, so a single
  implementation covers both; no separate listener code to drift.
- `x`/`y` remain writable, which VueUse also allows.
