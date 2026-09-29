# `usePreferredReducedMotion`

Reactive reduced-motion preference.
Inspired by [VueUse `usePreferredReducedMotion`](https://vueuse.org/core/usePreferredReducedMotion/).

## Signature

```ts
import { usePreferredReducedMotion } from 'sv-utils';

const motion = usePreferredReducedMotion();
motion.value; // 'reduce' | 'no-preference'
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
	import { usePreferredReducedMotion } from 'sv-utils';
	import { fade } from 'svelte/transition';

	const motion = usePreferredReducedMotion();
</script>

{#if motion.value === 'reduce'}
	<div>Static content</div>
{:else}
	<div transition:fade>Animated content</div>
{/if}
```

### SSR behavior

Reports `'no-preference'` on the server; hydrates live on mount. Must be
called in component initialization.

## Edge cases & cleanup

- Disposal is automatic.

## Parity notes

- Direct port of the `(prefers-reduced-motion: reduce)` wrapper.
