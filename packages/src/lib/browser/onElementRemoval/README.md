# `onElementRemoval`

Fire a callback when an element — or any ancestor — leaves the DOM.
Inspired by [VueUse `onElementRemoval`](https://vueuse.org/core/onElementRemoval/).

## Signature

```ts
import { onElementRemoval } from 'sv-utils';

const stop = onElementRemoval(
	() => tooltip,
	() => cleanup()
);
```

## Options

| Option     | Type                     | Default    | Description                   |
| ---------- | ------------------------ | ---------- | ----------------------------- |
| `document` | `Document \| ShadowRoot` | `document` | Root to observe for removals. |

## Returns

A `stop()` function that disconnects the observer permanently.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { onElementRemoval } from 'sv-utils';

	let tooltip = $state<HTMLDivElement | null>(null);

	onElementRemoval(
		() => tooltip,
		() => {
			cancelPendingWork();
		}
	);
</script>

<div bind:this={tooltip}>…</div>
```

### Watching inside a shadow root

```ts
const stop = onElementRemoval(() => node, onGone, { document: shadowRoot });
```

### SSR behavior

Without a DOM (or without `MutationObserver`) the call returns a stop
function and observes nothing.

## Edge cases & cleanup

- Fires for the element itself and for any ancestor removal, since the
  whole `document` (or given root) is observed with
  `{ childList: true, subtree: true }`.
- Unrelated removals are filtered by checking each removed node and its
  descendants — never by comparing subtree snapshots.
- A getter target is re-adopted reactively: swapping the element
  disconnects the old observation and starts watching the new one.
- `stop()` disconnects permanently; disposal does the same.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- VueUse's `flush` option is dropped: there is no Vue scheduler here,
  and the `$effect` subscription covers target changes.
- The watched root defaults to `document` and accepts a shadow root,
  matching upstream's `ConfigurableDocumentOrShadowRoot`.
