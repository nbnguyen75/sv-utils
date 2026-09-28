# `useToggle`

Boolean (or two-value) state with a toggler.
Inspired by [VueUse `useToggle`](https://vueuse.org/shared/useToggle/).

## Signature

```ts
import { useToggle } from 'sv-utils';

const toggle = useToggle();
toggle.toggle();

const theme = useToggle('light', { falsyValue: 'light', truthyValue: 'dark' });
```

## Options

| Parameter      | Type                       | Default     | Description                                                      |
| -------------- | -------------------------- | ----------- | ---------------------------------------------------------------- |
| `initialValue` | `T \| (() => T)`           | falsy value | Starting value; getters resolve once at creation.                |
| `truthyValue`  | `Truthy \| (() => Truthy)` | `true`      | Value considered "on"; getters resolve at each toggle.           |
| `falsyValue`   | `Falsy \| (() => Falsy)`   | `false`     | Value considered "off"; defaults the initial value when omitted. |

## Returns

| Field    | Type               | Reactive        | Description                                                                             |
| -------- | ------------------ | --------------- | --------------------------------------------------------------------------------------- |
| `value`  | `T`                | getter + setter | Current value (destructure-safe).                                                       |
| `toggle` | `(value?: T) => T` | method          | Flip truthy/falsy, or set explicitly when an argument is passed. Returns the new value. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useToggle } from 'sv-utils';

	const visible = useToggle();
</script>

<button onclick={() => visible.toggle()}>
	{visible.value ? 'Hide' : 'Show'}
</button>
```

### SSR behavior

Pure `$state` logic with no DOM access and no effects — safe to create and
use during SSR. Each server render gets an independent instance.

## Edge cases & cleanup

- Passing an argument (even `undefined`) always sets instead of flipping;
  `arguments.length` distinguishes the two call shapes.
- Getter-based truthy/falsy values re-resolve on every toggle, so they can
  track external state.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Returns a `{ value, toggle }` object instead of VueUse's `[ref, toggle]`
  tuple (or bare toggle for ref inputs); the `value` setter covers the
  external-ref use case.
