# `until`

Promised one-time watches: resolve when a source meets a condition.
Inspired by [VueUse `until`](https://vueuse.org/shared/until/).

## Signature

```ts
import { until } from 'sv-utils';

await until(() => status).toBe('ready');
await until(() => count).toMatch((value) => value > 7);
await until(() => items).toContains(target);
const current = await until(() => job).changed();
```

## Options

Every matcher accepts `{ timeout?, throwOnTimeout? }`:

| Option           | Type      | Default | Description                                                     |
| ---------------- | --------- | ------- | --------------------------------------------------------------- |
| `timeout`        | `number`  | `0`     | Settle with the current value after this many ms (`0` = never). |
| `throwOnTimeout` | `boolean` | `false` | Reject with `until() timed out after Nms` instead of resolving. |

## Matchers

| Matcher                                                         | Resolves with                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| `toBe(value)`                                                   | The value once strictly equal (getter targets tracked too)   |
| `toMatch(condition)`                                            | The first value satisfying the predicate                     |
| `changed()` / `changedTimes(n)`                                 | The value after 1 (or `n`) changes                           |
| `toBeTruthy()` / `toBeNull()` / `toBeUndefined()` / `toBeNaN()` | The matching value                                           |
| `toContains(value)` (arrays)                                    | The array once it contains the value                         |
| `.not.*`                                                        | Inverted variants (resolve when the condition does NOT hold) |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { until } from 'sv-utils';

	let ready = $state(false);

	onMount(async () => {
		await until(() => ready).toBe(true);
		startHeavyWork();
	});
</script>

<button onclick={() => (ready = true)}>Go</button>
```

> Build the full `until(…).matcher(…)` chain **synchronously** in setup
> (each matcher installs its one-shot `$effect` at call time); `await` the
> promise afterwards.

### SSR behavior

`until()` itself creates nothing and is safe anywhere; matchers need
component initialization. Nothing resolves on the server (no changes
occur there).

## Edge cases & cleanup

- Already-matching conditions resolve on the mount flush; each condition
  evaluates exactly once per genuine change (counting matchers like
  `changedTimes` are exact).
- A timeout still settles after unmount (bounded leak of at most the
  timeout duration — VueUse parity).
- Unmatched promises without timeout stay pending (VueUse parity).
- Must be called in component initialization (matchers use `$effect`).

## Parity notes

- Same matcher set and timeout race; simplified types (no conditional
  `Not`/`Exclude` gymnastics) and no `deep` option. Dual-tracking of
  getter targets in `toBe` is preserved.
