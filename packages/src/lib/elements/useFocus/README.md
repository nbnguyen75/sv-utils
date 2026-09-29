# `useFocus`

Track or set an element's focus state.
Inspired by [VueUse `useFocus`](https://vueuse.org/core/useFocus/).

## Signature

```ts
import { useFocus } from 'sv-utils';

const { focused } = useFocus(() => input, { initialValue: true });
focused.value = false; // blurs the element
```

## Options

| Parameter       | Type           | Default    | Description                                                          |
| --------------- | -------------- | ---------- | -------------------------------------------------------------------- |
| `target`        | `MaybeElement` | (required) | Element or getter (e.g. `bind:this` state).                          |
| `initialValue`  | `boolean`      | `false`    | Starting value; `true` focuses on mount; re-applied on target swaps. |
| `focusVisible`  | `boolean`      | `false`    | Only count `:focus-visible` matches as focused.                      |
| `preventScroll` | `boolean`      | `false`    | Passed to `focus()` to suppress scrolling.                           |

## Returns

| Field     | Type      | Reactive        | Description                                              |
| --------- | --------- | --------------- | -------------------------------------------------------- |
| `focused` | `boolean` | getter + setter | Read for state; assign `true` to focus, `false` to blur. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useFocus } from 'sv-utils';

	let input: HTMLInputElement | null = null;
	const { focused } = useFocus(() => input, { initialValue: true });
</script>

<input bind:this={input} /><p>{focused ? 'Editing…' : 'Idle'}</p>
```

### SSR behavior

Reports `initialValue` on the server; live focus attaches on mount. Must
be called in component initialization.

## Edge cases & cleanup

- Redundant setter writes are ignored (no focus/blur storms).
- Target swaps reset to `initialValue`.
- Listeners dispose on unmount.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same focus/visible/scroll semantics; no `window` option.
