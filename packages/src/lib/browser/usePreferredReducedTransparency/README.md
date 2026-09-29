# `usePreferredReducedTransparency`

Reactive reduced-transparency preference.
Inspired by [VueUse `usePreferredReducedTransparency`](https://vueuse.org/core/usePreferredReducedTransparency/).

## Signature

```ts
import { usePreferredReducedTransparency } from 'sv-utils';

const transparency = usePreferredReducedTransparency();
transparency.value; // 'reduce' | 'no-preference'
```

## Options

None.

## Returns

| Field   | Type                          | Reactive | Description           |
| ------- | ----------------------------- | -------- | --------------------- |
| `value` | `'reduce' \| 'no-preference'` | getter   | Effective preference. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePreferredReducedTransparency } from 'sv-utils';

	const transparency = usePreferredReducedTransparency();
</script>

<div class:opaque={transparency.value === 'reduce'}>Content</div>
```

### SSR behavior

Reports `'no-preference'` on the server; hydrates live on mount. Must be
called in component initialization.

## Edge cases & cleanup

- Disposal is automatic.

## Parity notes

- Direct port of the `(prefers-reduced-transparency: reduce)` wrapper.
