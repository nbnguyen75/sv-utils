# `useAsyncState`

Reactive async state machine with race guards and lifecycle callbacks.
Inspired by [VueUse `useAsyncState`](https://vueuse.org/core/useAsyncState/).

## Signature

```ts
import { useAsyncState } from 'sv-utils';

const user = useAsyncState(() => fetchUser(id), null, {
	onError: (error) => toast(error)
});
await user; // waits until loaded
await user.execute();
```

## Options

| Parameter        | Type                                            | Default       | Description                                                        |
| ---------------- | ----------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `promise`        | `Promise<D> \| ((...args: Args) => Promise<D>)` | (required)    | Promise or factory receiving `execute` arguments.                  |
| `initialState`   | `MaybeGetter<D>`                                | (required)    | Value held until the first execution settles.                      |
| `immediate`      | `boolean`                                       | `true`        | Run on creation (after `delay` when set).                          |
| `delay`          | `number`                                        | `0`           | Delay before the immediate execution, in ms.                       |
| `onError`        | `(error: unknown) => void`                      | safe reporter | Called with the rejection reason on failure.                       |
| `onSuccess`      | `(data: D) => void`                             | —             | Called with data on success (including stale executions).          |
| `resetOnExecute` | `boolean`                                       | `true`        | Reset to the initial value before each execution.                  |
| `throwError`     | `boolean`                                       | `false`       | Re-throw failures from `execute` instead of resolving `undefined`. |

## Returns

| Field              | Type                                                         | Reactive | Description                                   |
| ------------------ | ------------------------------------------------------------ | -------- | --------------------------------------------- |
| `state`            | `D`                                                          | getter   | Latest settled data (destructure-safe).       |
| `isReady`          | `boolean`                                                    | getter   | Whether an execution has settled.             |
| `isLoading`        | `boolean`                                                    | getter   | Whether an execution is in flight.            |
| `error`            | `unknown`                                                    | getter   | Latest failure of the current generation.     |
| `execute`          | `(delay?: number, ...args: Args) => Promise<D \| undefined>` | method   | Run; only the latest execution settles state. |
| `executeImmediate` | `(...args: Args) => Promise<D \| undefined>`                 | method   | Run without delay.                            |

The return is awaitable: `await` resolves a settled **snapshot view** (same
fields and methods, no `then`) once the current execution finishes.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useAsyncState } from 'sv-utils';

	const user = useAsyncState((id: number) => fetchUser(id), null, {
		immediate: false
	});
	user.executeImmediate(7);
</script>

{#if user.isLoading}
	<p>Loading…</p>
{:else if user.error}
	<p>Failed</p>
{:else if user.state}
	<p>{user.state.name}</p>
{/if}
```

### SSR behavior

Promise-only with no DOM access — safe to create anywhere. An `immediate`
execution still fires on the server (nothing DOM-bound); each server
render gets an independent instance.

## Edge cases & cleanup

- Overlapping executions race-guard by generation: stale responses never
  touch state, but `onSuccess`/`onError` still fire for every execution
  (VueUse parity).
- No timers survive: the optional delay is a single one-shot per execution.
- `execute` never rejects unless `throwError` is set.

## Parity notes

- Same flags/callbacks/race semantics; always deep `$state` (VueUse's
  `shallow` option has no Svelte equivalent need — proxies are lazy).
  Awaiting resolves a snapshot view rather than the live shell, because a
  thenable resolving to itself can never settle.
