# `useResizeObserver`

`ResizeObserver` wrapper with multi-target support and disposal.
Inspired by [VueUse `useResizeObserver`](https://vueuse.org/core/useResizeObserver/).

## Signature

```ts
import { useResizeObserver } from 'sv-utils';

const { isSupported, stop } = useResizeObserver(
	() => element,
	(entries) => {
		console.log(entries[0]?.contentRect);
	}
);
```

## Options

| Parameter  | Type                             | Default    | Description                                     |
| ---------- | -------------------------------- | ---------- | ----------------------------------------------- |
| `target`   | `MaybeElement \| MaybeElement[]` | (required) | Element(s) or getters; nullish entries skipped. |
| `callback` | `ResizeObserverCallback`         | (required) | Observer callback.                              |
| `options`  | `ResizeObserverOptions`          | `{}`       | Observer init (e.g. `{ box: 'border-box' }`).   |

`MaybeElement` is `Element | (() => Element | null | undefined) | null | undefined` — pass `bind:this` state directly.

## Returns

| Field         | Type         | Description                                           |
| ------------- | ------------ | ----------------------------------------------------- |
| `isSupported` | `boolean`    | `ResizeObserver` exists here (always `false` on SSR). |
| `stop`        | `() => void` | Disconnect permanently; safe repeated.                |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useResizeObserver } from 'sv-utils';

	let panel: HTMLElement | null = null;
	useResizeObserver(
		() => panel,
		([entry]) => {
			console.log(entry?.contentRect.width);
		}
	);
</script>

<div bind:this={panel}>…</div>
```

### SSR behavior

Reports `isSupported: false` and never observes on the server. Targets
resolving late (after `bind:this` wires up) attach automatically. Must be
called in component initialization.

## Edge cases & cleanup

- Elements are duck-typed, never `instanceof`-checked (cross-realm safe).
- Target swaps re-observe (old observer disconnects first).
- `stop()` disconnects; unmount disposal is automatic.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Same observe-all-targets semantics; no `window` option (global scope
  only). Deprecated upstream `ResizeObserverEntry` re-exports are omitted
  (use the DOM lib types).
