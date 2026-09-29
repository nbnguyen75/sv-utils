# `usePageLeave`

Reactive page-leave detection (pointer leaving the viewport).
Inspired by [VueUse `usePageLeave`](https://vueuse.org/core/usePageLeave/).

## Signature

```ts
import { usePageLeave } from 'sv-utils';

const left = usePageLeave();
left.value; // boolean
```

## Options

None.

## Returns

| Field   | Type      | Reactive | Description                        |
| ------- | --------- | -------- | ---------------------------------- |
| `value` | `boolean` | getter   | Whether the pointer left the page. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePageLeave } from 'sv-utils';

	const left = usePageLeave();
</script>

{#if left.value}
	<ExitIntentOffer />
{/if}
```

### SSR behavior

Reports `false` on the server; attaches on mount. Must be called in
component initialization.

## Edge cases & cleanup

- Listens to window `mouseout` plus document `mouseleave`/`mouseenter`;
  the page counts as left only when the pointer moves to nothing (legacy
  `toElement` covered without casts).
- Listeners dispose on unmount.
- Must be called in component initialization (uses `$state` / `$effect`
  via listeners).

## Parity notes

- Same events and null-target semantics; legacy `toElement` typed via an
  interface instead of `any`.
