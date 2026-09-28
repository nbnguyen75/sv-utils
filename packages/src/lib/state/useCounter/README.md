# `useCounter`

Counter with clamped increment / decrement / set / reset helpers.
Inspired by [VueUse `useCounter`](https://vueuse.org/shared/useCounter/).

## Signature

```ts
import { useCounter } from 'sv-utils';

const counter = useCounter(0, { min: 0, max: 10 });
counter.inc();
counter.dec(2);
counter.reset();
```

## Options

| Parameter      | Type                       | Default     | Description                                             |
| -------------- | -------------------------- | ----------- | ------------------------------------------------------- |
| `initialValue` | `number \| (() => number)` | `0`         | Starting value (not clamped, mirroring VueUse).         |
| `min`          | `number`                   | `-Infinity` | Lower bound applied to `inc` / `dec` / `set` / `reset`. |
| `max`          | `number`                   | `Infinity`  | Upper bound applied to `inc` / `dec` / `set` / `reset`. |

## Returns

| Field   | Type                       | Reactive | Description                                                |
| ------- | -------------------------- | -------- | ---------------------------------------------------------- |
| `count` | `number`                   | getter   | Current count; write via `set` (destructure-safe).         |
| `inc`   | `(delta?: number) => void` | method   | Add `delta` (default `1`), clamped.                        |
| `dec`   | `(delta?: number) => void` | method   | Subtract `delta` (default `1`), clamped.                   |
| `get`   | `() => number`             | method   | Read the current count.                                    |
| `set`   | `(value: number) => void`  | method   | Set the count, clamped.                                    |
| `reset` | `(value?: number) => void` | method   | Restore the initial value, or redefine it when passed one. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useCounter } from 'sv-utils';

	const counter = useCounter(0, { min: 0 });
</script>

<button onclick={() => counter.dec()}>−</button>
<span>{counter.count}</span>
<button onclick={() => counter.inc()}>+</button>
```

### SSR behavior

Pure `$state` logic with no DOM access and no effects — safe to create and
use during SSR. Each server render gets an independent instance.

## Edge cases & cleanup

- `reset(value)` both jumps to `value` and redefines what a later bare
  `reset()` restores.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- `count` is a getter (no setter) instead of VueUse's readonly ref; the
  initial value may be a getter resolved once, matching VueUse's
  `MaybeRef` snapshot behavior.
