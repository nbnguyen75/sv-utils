# `useMutationObserver`

`MutationObserver` wrapper with multi-target support, disposal, and
pending-record access.
Inspired by [VueUse `useMutationObserver`](https://vueuse.org/core/useMutationObserver/).

## Signature

```ts
import { useMutationObserver } from 'sv-utils';

const { isSupported, stop, takeRecords } = useMutationObserver(
	() => element,
	(records) => {
		console.log(records);
	},
	{ attributes: true }
);
```

## Options

| Parameter  | Type                             | Default    | Description                                     |
| ---------- | -------------------------------- | ---------- | ----------------------------------------------- |
| `target`   | `MaybeElement \| MaybeElement[]` | (required) | Element(s) or getters; nullish entries skipped. |
| `callback` | `MutationCallback`               | (required) | Observer callback.                              |
| `options`  | `MutationObserverInit`           | `{}`       | What to observe (e.g. `{ childList: true }`).   |

## Returns

| Field         | Type                                  | Description                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------- |
| `isSupported` | `boolean`                             | `MutationObserver` exists here (always `false` on SSR). |
| `stop`        | `() => void`                          | Disconnect permanently; safe repeated.                  |
| `takeRecords` | `() => MutationRecord[] \| undefined` | Drain pending records without disconnecting.            |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useMutationObserver } from 'sv-utils';

	let article: HTMLElement | null = null;
	useMutationObserver(
		() => article,
		() => recount(),
		{ childList: true, subtree: true }
	);
</script>

<article bind:this={article}>…</article>
```

### SSR behavior

Reports `isSupported: false` and never observes on the server. Must be
called in component initialization.

## Edge cases & cleanup

- Target swaps re-observe; `takeRecords()` never disconnects.
- `stop()` disconnects; unmount disposal is automatic.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Same semantics; no `window` option (global scope only).
