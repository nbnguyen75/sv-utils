# `useDocumentVisibility`

Reactive `document.visibilityState`.
Inspired by [VueUse `useDocumentVisibility`](https://vueuse.org/core/useDocumentVisibility/).

## Signature

```ts
import { useDocumentVisibility } from 'sv-utils';

const visibility = useDocumentVisibility();
visibility.value; // 'visible' | 'hidden' | ...
```

## Options

None.

## Returns

| Field   | Type                      | Reactive | Description                            |
| ------- | ------------------------- | -------- | -------------------------------------- |
| `value` | `DocumentVisibilityState` | getter   | Current visibility (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useDocumentVisibility } from 'sv-utils';

	const visibility = useDocumentVisibility();
</script>

{#if visibility.value === 'hidden'}
	<p>Paused — tab in background</p>
{/if}
```

### SSR behavior

Reports `'visible'` on the server; hydrates live on mount. Must be
called in component initialization.

## Edge cases & cleanup

- Refreshes on `visibilitychange`; disposal is automatic.
- Must be called in component initialization (uses `$state` / `$effect`
  via the listener).

## Parity notes

- Direct port; no `document` option (global document only, per
  isomorphic rule).
