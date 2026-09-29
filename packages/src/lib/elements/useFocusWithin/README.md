# `useFocusWithin`

Track whether focus sits inside a target element.
Inspired by [VueUse `useFocusWithin`](https://vueuse.org/core/useFocusWithin/).

## Signature

```ts
import { useFocusWithin } from 'sv-utils';

const { focused } = useFocusWithin(() => dialog);
```

## Options

| Parameter | Type           | Default    | Description                                 |
| --------- | -------------- | ---------- | ------------------------------------------- |
| `target`  | `MaybeElement` | (required) | Element or getter (e.g. `bind:this` state). |

## Returns

| Field     | Type      | Reactive | Description                                      |
| --------- | --------- | -------- | ------------------------------------------------ |
| `focused` | `boolean` | getter   | Whether the element or a descendant holds focus. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useFocusWithin } from 'sv-utils';

	let menu: HTMLElement | null = null;
	const { focused } = useFocusWithin(() => menu);
</script>

<div bind:this={menu} data-open={focused}>…</div>
```

### SSR behavior

Reports `false` on the server; attaches on mount. Must be called in
component initialization.

## Edge cases & cleanup

- `focusin` marks focused; `focusout` re-checks `:focus-within`, so focus
  moving between descendants stays `true`.
- Listeners dispose on unmount.
- Must be called in component initialization (uses `$state` / `$effect`
  via listeners).

## Parity notes

- Same event semantics without the setup-time early-return wrapper;
  no `window` option.
