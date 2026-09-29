# `useWindowFocus`

Reactive window focus state.
Inspired by [VueUse `useWindowFocus`](https://vueuse.org/core/useWindowFocus/).

## Signature

```ts
import { useWindowFocus } from 'sv-utils';

const focused = useWindowFocus();
focused.value; // boolean
```

## Options

None.

## Returns

| Field   | Type      | Reactive | Description                                        |
| ------- | --------- | -------- | -------------------------------------------------- |
| `value` | `boolean` | getter   | Whether the window holds focus (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useWindowFocus } from 'sv-utils';

	const focused = useWindowFocus();
</script>

{#if !focused.value}
	<p>Click back into the window to continue</p>
{/if}
```

### SSR behavior

Starts from `document.hasFocus()` on mount, `false` on the server. Must
be called in component initialization.

## Edge cases & cleanup

- Blur/focus listeners dispose on unmount.
- Must be called in component initialization (uses `$state` / `$effect`
  via listeners).

## Parity notes

- Direct port; no `window` option (global scope only).
