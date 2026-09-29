# `useScrollLock`

Lock and unlock scrolling of an element, window, or document.
Inspired by [VueUse `useScrollLock`](https://vueuse.org/core/useScrollLock/).

## Signature

```ts
import { useScrollLock } from 'sv-utils';

const lock = useScrollLock(); // page
lock.value = true; // overflow: hidden
lock.value = false; // restores previous overflow
```

## Options

There is no options object; positional arguments are used.

| Argument       | Type                        | Default                    | Description                                                   |
| -------------- | --------------------------- | -------------------------- | ------------------------------------------------------------- |
| `target`       | `MaybeGetter<ScrollTarget>` | `document.documentElement` | Element, window, or document to lock; omitted locks the page. |
| `initialState` | `boolean`                   | `false`                    | Whether to lock on mount.                                     |

`ScrollTarget` is `HTMLElement | SVGElement | Window | Document | null | undefined`.

## Returns

| Field   | Type      | Reactive      | Description                                         |
| ------- | --------- | ------------- | --------------------------------------------------- |
| `value` | `boolean` | getter/setter | Whether scrolling is locked. Assign to lock/unlock. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useScrollLock } from 'sv-utils';

	const lock = useScrollLock();
</script>

<button onclick={() => (lock.value = true)}>Open modal</button>
<button onclick={() => (lock.value = false)}>Close modal</button>
```

### Locking a scrollable panel

```svelte
<script lang="ts">
	import { useScrollLock } from 'sv-utils';

	let panel = $state<HTMLDivElement | null>(null);
	// getter target: re-locks when `panel` changes
	const lock = useScrollLock(() => panel, true);
</script>

<div bind:this={panel} style="overflow: auto; height: 12rem">…</div><p>locked: {lock.value}</p>
```

### SSR behavior

On the server nothing is styled or observed: `value` reflects
`initialState` only. Locking happens in an `$effect`, so it applies on
the client on mount and the server HTML is untouched.

## Edge cases & cleanup

- The original inline `overflow` of each locked element is remembered in
  a `WeakMap`, so nested/independent locks restore their own value and
  garbage-collected elements never leak.
- A getter target is re-evaluated reactively: swapping the element
  restores the previous one and applies the lock to the new one.
- Unmount restores the last locked element's `overflow` even if you
  never unlocked manually. The restore path uses a plain disposal mirror
  rather than reading reactive state, because `$state` reads inside a
  teardown cleanup observe pre-teardown values.
- If the target already has `overflow: hidden`, locking is adopted
  (reported as locked) and the hidden value is not mistaken for the
  "previous" overflow on restore.
- On iOS, `touchmove` is prevented while locked, except inside a nested
  scrollable ancestor and for multi-touch gestures.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- No options object; VueUse's `initialState` is the second positional
  argument here, matching its signature.
- iOS `touchmove` prevention is included, matching upstream behavior.
