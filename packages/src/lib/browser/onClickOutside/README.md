# `onClickOutside`

Listen for clicks landing outside an element, with ignore lists and
iframe detection.
Inspired by [VueUse `onClickOutside`](https://vueuse.org/core/onClickOutside/).

## Signature

```ts
import { onClickOutside } from 'sv-utils';

const stop = onClickOutside(
	() => menu,
	() => close()
);
```

## Options

| Option         | Type                                         | Default | Description                                              |
| -------------- | -------------------------------------------- | ------- | -------------------------------------------------------- |
| `ignore`       | `MaybeGetter<Array<MaybeElement \| string>>` | `[]`    | Elements/getters or CSS selectors that never trigger.    |
| `capture`      | `boolean`                                    | `true`  | Use the capture phase for the click listener.            |
| `detectIframe` | `boolean`                                    | `false` | Fire when focus moves into an iframe.                    |
| `controls`     | `boolean`                                    | `false` | Return `{ stop, cancel, trigger }` instead of a stop fn. |

## Returns

Without `controls`: a `stop()` function. With `controls: true`:

| Field       | Type                     | Description                              |
| ----------- | ------------------------ | ---------------------------------------- |
| `stop()`    | `() => void`             | Silence the instance permanently.        |
| `cancel()`  | `() => void`             | Skip the next outside click.             |
| `trigger()` | `(event: Event) => void` | Run the check manually for a real event. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { onClickOutside } from 'sv-utils';

	let menu = $state<HTMLDivElement | null>(null);
	let open = $state(false);

	onClickOutside(
		() => menu,
		() => (open = false)
	);
</script>

{#if open}
	<div bind:this={menu}>…</div>
{/if}
```

### Ignoring a toggle button

```ts
onClickOutside(
	() => menu,
	() => (open = false),
	{
		ignore: [() => toggle, '.keep-open']
	}
);
```

### Manual controls

```ts
const { stop, cancel, trigger } = onClickOutside(() => menu, onOutside, {
	controls: true
});
```

### SSR behavior

Outside the browser the call is a no-op returning a stop function (or
inert controls). Nothing is observed on the server.

## Edge cases & cleanup

- Clicks that _start_ inside (pointerdown on the element) suppress the
  following outside click — this is what keeps a mousedown-inside /
  mouseup-outside drag from closing menus. Suppression resets after one
  click.
- Programmatic `click()` calls carry `detail: 0` and recompute the
  ignore check instead of trusting the pointerdown state; real user
  clicks (`detail ≥ 1`) use the pointerdown state.
- Rapid re-entrant clicks are debounced with a macrotask guard.
- `trigger()` needs a real dispatched event (it reads `target` and the
  composed path); an undispatched event is ignored like any targetless
  event.
- On iOS, permanent no-op click listeners are attached once per page
  load so outside taps register — never disposed, by design.
- `stop()` silences the instance permanently; listeners dispose with
  the component.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Vue's multi-root component handling is dropped: targets are plain
  elements, which have a single composed path.
- The handler type narrows with the options (`FocusEvent` appears only
  with `detectIframe: true`), matching upstream's conditional handler.
