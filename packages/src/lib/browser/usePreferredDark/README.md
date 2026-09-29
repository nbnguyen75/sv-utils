# `usePreferredDark`

Reactive OS dark-theme preference.
Inspired by [VueUse `usePreferredDark`](https://vueuse.org/core/usePreferredDark/).

## Signature

```ts
import { usePreferredDark } from 'sv-utils';

const dark = usePreferredDark();
dark.value; // boolean
```

## Options

None.

## Returns

| Field   | Type      | Reactive | Description                                            |
| ------- | --------- | -------- | ------------------------------------------------------ |
| `value` | `boolean` | getter   | Whether the OS prefers dark colors (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePreferredDark } from 'sv-utils';

	const dark = usePreferredDark();
</script>

<p>OS theme: {dark.value ? 'dark' : 'light'}</p>
```

Pair with `useDark` (persisted override) for a complete theme story.

### SSR behavior

Reports `false` on the server; hydrates live on mount. Must be called in
component initialization.

## Edge cases & cleanup

- Disposal is automatic (via `useMediaQuery`).

## Parity notes

- Thin `(prefers-color-scheme: dark)` wrapper, like upstream.
