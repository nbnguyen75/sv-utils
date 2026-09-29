# `useMediaQuery`

Reactive CSS media-query matching.
Inspired by [VueUse `useMediaQuery`](https://vueuse.org/core/useMediaQuery/).

## Signature

```ts
import { useMediaQuery } from 'sv-utils';

const wide = useMediaQuery('(min-width: 1024px)');
wide.value; // boolean
```

## Options

| Parameter    | Type                  | Default    | Description                                                                                    |
| ------------ | --------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `query`      | `MaybeGetter<string>` | (required) | CSS media query; changing a reactive query re-subscribes.                                      |
| `ssrMatches` | `boolean`             | `false`    | Value reported without `matchMedia` (SSR); pick the server render to avoid hydration mismatch. |

## Returns

| Field   | Type      | Reactive | Description                                   |
| ------- | --------- | -------- | --------------------------------------------- |
| `value` | `boolean` | getter   | Whether the query matches (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useMediaQuery } from 'sv-utils';

	const wide = useMediaQuery('(min-width: 1024px)');
</script>

{#if wide.value}
	<Sidebar />
{/if}
```

### SSR behavior

Reports `ssrMatches` on the server and hydrates from the live query on
mount. Disposal is automatic. Must be called in component initialization.

## Edge cases & cleanup

- Reactive queries re-subscribe (match state re-syncs, old listener
  removed).
- Invalid queries and missing `matchMedia` fall back safely instead of
  throwing.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- No `window` option (global scope only, per isomorphic rule) and no
  `ssrWidth` evaluation (that helper was cut — use `ssrMatches` for the
  server render instead).
