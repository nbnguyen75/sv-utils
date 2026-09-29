# `useInfiniteScroll`

Load more content when a scroll container reaches an edge.
Inspired by [VueUse `useInfiniteScroll`](https://vueuse.org/core/useInfiniteScroll/).

## Signature

```ts
import { useInfiniteScroll } from 'sv-utils';

const { isLoading } = useInfiniteScroll(
	() => list,
	async () => {
		await appendNextPage();
	},
	{ direction: 'bottom', distance: 120 }
);
```

## Options

Extends every [`useScroll`](../useScroll/README.md) option (`throttle`,
`idle`, `offset`, `observe`, `onScroll`, `onStop`,
`eventListenerOptions`, `behavior`, `onError`) plus:

| Option        | Type                                              | Default      | Description                                                      |
| ------------- | ------------------------------------------------- | ------------ | ---------------------------------------------------------------- |
| `distance`    | `number`                                          | `0`          | Minimum distance (px) from the edge that still triggers loading. |
| `direction`   | `'top' \| 'bottom' \| 'left' \| 'right'`          | `'bottom'`   | Edge to observe.                                                 |
| `interval`    | `number`                                          | `100`        | Quiet period (ms) after each load before the next may start.     |
| `canLoadMore` | `(element: HTMLElement \| SVGElement) => boolean` | `() => true` | Gate loading per element (e.g. "not already fully loaded").      |

## Returns

| Field       | Type         | Reactive | Description                          |
| ----------- | ------------ | -------- | ------------------------------------ |
| `isLoading` | `boolean`    | getter   | Whether a load is in flight.         |
| `reset()`   | `() => void` | method   | Re-check the trigger conditions now. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useInfiniteScroll } from 'sv-utils';

	let list = $state<HTMLDivElement | null>(null);
	let page = $state(1);

	const { isLoading } = useInfiniteScroll(
		() => list,
		async () => {
			page += 1;
			await fetchPage(page);
		},
		{ distance: 200 }
	);
</script>

<div bind:this={list} style="overflow: auto; height: 20rem">
	{#each items as item (item.id)}
		<p>{item.title}</p>
	{/each}
</div>
<p>{isLoading ? 'Loading…' : 'Idle'}</p>
```

### Gating with `canLoadMore`

```ts
const { isLoading, reset } = useInfiniteScroll(() => feed, loadMore, {
	direction: 'bottom',
	canLoadMore: (element) => element.childElementCount < total
});
```

### SSR behavior

With no element resolved on the server, no measurement, observer, or
listener runs and `isLoading` stays `false`. The first check happens on
the client once the element is visible.

## Edge cases & cleanup

- Only one load is in flight at a time; extra arrivals are ignored until
  the pending promise settles and the `interval` quiet period elapses.
- After a load resolves, conditions are re-checked after `tick()`, so a
  container that is still not full keeps loading without a new scroll.
- When the element is not yet scrollable (`scrollSize <= clientSize`), the
  first load runs immediately — this is what makes short lists bootstrap.
- Element containers are gated on `useElementVisibility`, so a hidden
  scroll area (collapsed panel, off-screen feed) does not fire loads.
  `window`/`document` targets count as visible by definition and are
  measured on `document.documentElement`, so the first page load is not
  deferred behind an intersection callback.
- Scroll and visibility state are computed via locals, and each effect
  writes state once, avoiding read/write aliasing re-trigger loops.
- Timers and observers dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `distance` maps to VueUse's `distance` option, and `direction` to its
  `direction`; here `direction` also selects which `offset` edge is used
  for arrival.
- The loader receives the `useScroll` state so it can read position
  (useful for cursor-preserving prepend loads).
- `window` and `document` targets are supported, matching VueUse; they
  resolve to `document.documentElement` for measurement.
