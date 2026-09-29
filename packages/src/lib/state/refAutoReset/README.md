# `refAutoReset`

State that resets to its default some time after each write.
Inspired by [VueUse `refAutoReset`](https://vueuse.org/shared/refAutoReset/).

## Signature

```ts
import { refAutoReset } from 'sv-utils';

const notice = refAutoReset('idle', 3000);
notice.value = 'saved'; // back to 'idle' after 3s of quiet
```

## Options

| Parameter      | Type                  | Default    | Description                                        |
| -------------- | --------------------- | ---------- | -------------------------------------------------- |
| `defaultValue` | `MaybeGetter<T>`      | (required) | Fallback value; getters re-resolve on every reset. |
| `afterMs`      | `MaybeGetter<number>` | `10000`    | Quiet period in ms; getters resolve per write.     |

## Returns

| Field   | Type | Reactive        | Description                                 |
| ------- | ---- | --------------- | ------------------------------------------- |
| `value` | `T`  | getter + setter | Current value; assigning re-arms the timer. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { refAutoReset } from 'sv-utils';

	const status = refAutoReset('idle', 2000);
</script>

<button
	onclick={() => {
		save();
		status.value = 'saved!';
	}}
>
	Save ({status.value})
</button>
```

### SSR behavior

Initializes to the default without timers; safe during SSR. Countdowns
arm on write and the pending timer disposes with the component.

## Edge cases & cleanup

- Every write re-arms: only quiet periods trigger a reset.
- Unmounting clears a pending reset (no stale writes).
- Must be called in component initialization (timer disposal via `$effect`).

## Parity notes

- Same reset-on-quiet semantics; the default may be a getter re-resolved
  per reset.
