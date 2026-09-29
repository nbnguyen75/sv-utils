# `usePreferredContrast`

Reactive OS contrast preference.
Inspired by [VueUse `usePreferredContrast`](https://vueuse.org/core/usePreferredContrast/).

## Signature

```ts
import { usePreferredContrast } from 'sv-utils';

const contrast = usePreferredContrast();
contrast.value; // 'more' | 'less' | 'custom' | 'no-preference'
```

## Options

None.

## Returns

| Field   | Type                                              | Reactive | Description           |
| ------- | ------------------------------------------------- | -------- | --------------------- |
| `value` | `'more' \| 'less' \| 'custom' \| 'no-preference'` | getter   | Effective preference. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePreferredContrast } from 'sv-utils';

	const contrast = usePreferredContrast();
</script>

<div class:high-contrast={contrast.value === 'more'}>
	<slot />
</div>
```

### SSR behavior

Reports `'no-preference'` on the server; hydrates live on mount. Must be
called in component initialization.

## Edge cases & cleanup

- Precedence is more → less → custom (matches upstream).
- Disposal is automatic.

## Parity notes

- Direct port of the three-query composition.
