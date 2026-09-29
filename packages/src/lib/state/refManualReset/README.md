# `refManualReset`

State with a manual reset back to its default.
Inspired by [VueUse `refManualReset`](https://vueuse.org/shared/refManualReset/).

## Signature

```ts
import { refManualReset } from 'sv-utils';

const draft = refManualReset('');
draft.value = 'hello';
draft.reset();
```

## Options

| Parameter      | Type             | Default    | Description                                                |
| -------------- | ---------------- | ---------- | ---------------------------------------------------------- |
| `defaultValue` | `MaybeGetter<T>` | (required) | Fallback value; getters resolve at creation and per reset. |

## Returns

| Field   | Type         | Reactive        | Description                       |
| ------- | ------------ | --------------- | --------------------------------- |
| `value` | `T`          | getter + setter | Current value (destructure-safe). |
| `reset` | `() => void` | method          | Restore the default value.        |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { refManualReset } from 'sv-utils';

	const query = refManualReset('');
</script>

<input bind:value={query.value} />
<button onclick={() => query.reset()}>Clear</button>
```

### SSR behavior

Pure `$state` logic with no DOM access and no effects — safe to create and
use during SSR.

## Edge cases & cleanup

- No timers, no effects — nothing to dispose; `reset()` is synchronous.

## Parity notes

- Same shape as VueUse (value plus `reset`), minus the Vue ref wrapper.
