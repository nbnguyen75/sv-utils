# `useActiveElement`

Reactive `document.activeElement` with shadow-DOM and removal tracking.
Inspired by [VueUse `useActiveElement`](https://vueuse.org/core/useActiveElement/).

## Signature

```ts
import { useActiveElement } from 'sv-utils';

const focused = useActiveElement();
focused.value; // HTMLElement | null | undefined
```

## Options

| Parameter          | Type      | Default | Description                                                         |
| ------------------ | --------- | ------- | ------------------------------------------------------------------- |
| `deep`             | `boolean` | `true`  | Pierce shadow roots when resolving.                                 |
| `triggerOnRemoval` | `boolean` | `false` | Re-resolve when the focused node leaves the DOM (MutationObserver). |

## Returns

| Field   | Type                               | Reactive | Description                         |
| ------- | ---------------------------------- | -------- | ----------------------------------- |
| `value` | `HTMLElement \| null \| undefined` | getter   | Focused element (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useActiveElement } from 'sv-utils';

	const focused = useActiveElement();
</script>

<p>Focused: {focused.value?.tagName ?? 'nothing'}</p>
```

### SSR behavior

Reports `undefined` on the server; reads live focus on mount. Must be
called in component initialization.

## Edge cases & cleanup

- `blur` only refreshes when focus truly leaves (`relatedTarget === null`);
  moving focus between elements refreshes via `focus`.
- Listeners (and the optional removal observer) dispose on unmount.
- Must be called in component initialization (uses `$state` / `$effect`
  only when `triggerOnRemoval` needs the observer; listeners always).

## Parity notes

- Same deep/removal semantics; no `window`/`document` options (global
  scope only). Removal tracking is a minimal inline observer — the full
  `onElementRemoval` arrives in feat-020.
