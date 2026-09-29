# `useTextDirection`

Reactive text direction (`dir`) of an element, writable back to the DOM.
Inspired by [VueUse `useTextDirection`](https://vueuse.org/core/useTextDirection/).

## Signature

```ts
import { useTextDirection } from 'sv-utils';

const dir = useTextDirection();
dir.value; // 'ltr' | 'rtl' | 'auto'
dir.value = 'rtl'; // writes the attribute
```

## Options

| Parameter      | Type                       | Default  | Description                                  |
| -------------- | -------------------------- | -------- | -------------------------------------------- |
| `selector`     | `string`                   | `'html'` | Element receiving the direction.             |
| `observe`      | `boolean`                  | `false`  | Follow `dir` changes via `MutationObserver`. |
| `initialValue` | `'ltr' \| 'rtl' \| 'auto'` | `'ltr'`  | Server and pre-mount value.                  |

## Returns

| Field   | Type                       | Reactive        | Description                           |
| ------- | -------------------------- | --------------- | ------------------------------------- |
| `value` | `'ltr' \| 'rtl' \| 'auto'` | getter + setter | Current direction (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useTextDirection } from 'sv-utils';

	const dir = useTextDirection({ observe: true });
</script>

<button onclick={() => (dir.value = dir.value === 'ltr' ? 'rtl' : 'ltr')}>
	Direction: {dir.value}
</button>
```

### SSR behavior

Renders `initialValue` on the server and re-reads the live attribute on
mount (which wins). Works with or without SvelteKit.

## Edge cases & cleanup

- Unknown/missing attributes fall back to `initialValue`; a missing
  selector target makes reads safe and writes no-ops.
- Assigning always writes the attribute (empty values remove it).
- The observer (if enabled) disconnects on unmount.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same read/write/observe semantics; no `document` option (global
  document only, per isomorphic rule).
