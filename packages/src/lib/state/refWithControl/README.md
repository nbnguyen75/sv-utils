# `refWithControl`

Fine-grained control over a state cell: vetoable writes, change
callbacks, and untracked reads.
Inspired by [VueUse `refWithControl`](https://vueuse.org/shared/refWithControl/).

## Signature

```ts
import { refWithControl } from 'sv-utils';

const age = refWithControl(0, {
	onBeforeChange: (value) => (value < 0 ? false : undefined),
	onChanged: (value, oldValue) => log(value, oldValue)
});
age.get(); // tracked read
age.peek(); // untracked read
```

## Options

| Parameter        | Type                                         | Default    | Description                                 |
| ---------------- | -------------------------------------------- | ---------- | ------------------------------------------- |
| `initial`        | `T`                                          | (required) | Starting value.                             |
| `onBeforeChange` | `(value: T, oldValue: T) => void \| boolean` | —          | Runs before a write; `false` dismisses it.  |
| `onChanged`      | `(value: T, oldValue: T) => void`            | —          | Runs synchronously after an accepted write. |

## Returns

| Field          | Type                        | Reactive        | Description                             |
| -------------- | --------------------------- | --------------- | --------------------------------------- |
| `value`        | `T`                         | getter + setter | Current value through veto + callbacks. |
| `get`          | `(tracking?: boolean) => T` | method          | Read, tracked by default.               |
| `set`          | `(value: T) => void`        | method          | Write through veto + callbacks.         |
| `untrackedGet` | `() => T`                   | method          | Read without subscribing.               |
| `peek`         | `() => T`                   | method          | Alias for `untrackedGet`.               |

## Examples

### Basic usage

```ts
import { refWithControl } from 'sv-utils';

const quantity = refWithControl(1, {
	onBeforeChange: (value) => Number.isInteger(value) && value > 0,
	onChanged: (value) => recalculate(value)
});
```

### SSR behavior

Pure `$state` logic with no DOM access and no effects — safe to create and
use during SSR.

## Edge cases & cleanup

- Writes strictly equal to the current value are skipped before callbacks.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- `silentSet`/`lay` are unsupported: Svelte notifies on every write, so
  silent writes are impossible — vetoes plus untracked reads cover the
  same flows. Everything else matches.
