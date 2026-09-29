# `useElementHover`

Track element hover, with optional enter/leave delays.
Inspired by [VueUse `useElementHover`](https://vueuse.org/core/useElementHover/).

## Signature

```ts
import { useElementHover } from 'sv-utils';

const hovered = useElementHover(() => card, { delayEnter: 100 });
hovered.value; // true shortly after entering
```

## Options

| Option             | Type      | Default | Description                                    |
| ------------------ | --------- | ------- | ---------------------------------------------- |
| `delayEnter`       | `number`  | `0`     | Delay before reporting hover, in milliseconds. |
| `delayLeave`       | `number`  | `0`     | Delay before reporting leave, in milliseconds. |
| `triggerOnRemoval` | `boolean` | `false` | Clear hover when the element leaves the DOM.   |

## Returns

| Field   | Type      | Reactive | Description                     |
| ------- | --------- | -------- | ------------------------------- |
| `value` | `boolean` | getter   | Whether the element is hovered. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useElementHover } from 'sv-utils';

	let card = $state<HTMLDivElement | null>(null);
	const { value: hovered } = useElementHover(() => card);
</script>

<div bind:this={card} class:highlighted={hovered}>Hover me</div>
```

### Debounced hover

```ts
// Only react after the pointer rests for 150ms — avoids flicker when
// the pointer crosses the element while moving.
const hovered = useElementHover(() => card, { delayEnter: 150, delayLeave: 400 });
```

### SSR behavior

Listeners and the optional `MutationObserver` are registered only in the
browser, so `value` stays `false` on the server and the rendered markup
is identical to the pre-hover state.

## Edge cases & cleanup

- `mouseenter`/`mouseleave` are used (not `mouseover`/`mouseout`), so
  moving between child elements does not toggle the state. Listeners are
  `passive`.
- A pending delay is cancelled whenever the opposite direction arrives,
  so quick enter/leave never leaves a stale timer behind.
- `triggerOnRemoval` watches document mutations and clears hover when the
  element is disconnected — important for `{#if}` blocks and list
  recycling, where no `mouseleave` ever fires.
- The pending timer is cleared on unmount, so a delayed enter cannot
  write to disposed state.
- `delayEnter`/`delayLeave` of `0` (the default) applies the state
  synchronously.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `delayEnter`/`delayLeave` mirror VueUse's option names; VueUse also
  exposes an `onHover` callback option, which this port omits because
  the reactive `value` plus Svelte effects cover the same use case
  without a second API.
