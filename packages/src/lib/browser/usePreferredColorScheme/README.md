# `usePreferredColorScheme`

Reactive OS color-scheme preference.
Inspired by [VueUse `usePreferredColorScheme`](https://vueuse.org/core/usePreferredColorScheme/).

## Signature

```ts
import { usePreferredColorScheme } from 'sv-utils';

const scheme = usePreferredColorScheme();
scheme.value; // 'dark' | 'light' | 'no-preference'
```

## Options

None.

## Returns

| Field   | Type                                   | Reactive | Description       |
| ------- | -------------------------------------- | -------- | ----------------- |
| `value` | `'dark' \| 'light' \| 'no-preference'` | getter   | Effective scheme. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePreferredColorScheme } from 'sv-utils';

	const scheme = usePreferredColorScheme();
</script>

<meta name="color-scheme" content={scheme.value} />
```

### SSR behavior

Reports `'no-preference'` on the server; hydrates live on mount. Must be
called in component initialization.

## Edge cases & cleanup

- Dark wins when both queries match (matches upstream precedence).
- Disposal is automatic.

## Parity notes

- Direct port of the two-query composition.
