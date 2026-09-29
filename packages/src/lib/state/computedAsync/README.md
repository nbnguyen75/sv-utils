# `computedAsync`

Async derivation with overlap guards and cancellation hooks.
Inspired by [VueUse `computedAsync`](https://vueuse.org/core/computedAsync/).

## Signature

```ts
import { computedAsync } from 'sv-utils';

const profile = computedAsync((onCancel) => fetchProfile(userId(), onCancel), null, {
	onError: (error) => toast(error)
});
profile.value; // latest settled (or initial)
```

## Options

| Parameter            | Type                                                          | Default       | Description                                                          |
| -------------------- | ------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| `evaluationCallback` | `(onCancel: (cancel: () => void) => void) => T \| Promise<T>` | (required)    | Runs tracked: whatever reactive state it reads becomes a dependency. |
| `initialState`       | `T`                                                           | (required)    | Value held until the first evaluation settles.                       |
| `onError`            | `(error: unknown) => void`                                    | safe reporter | Called with rejections.                                              |

## Returns

| Field        | Type      | Reactive | Description                              |
| ------------ | --------- | -------- | ---------------------------------------- |
| `value`      | `T`       | getter   | Latest settled value (destructure-safe). |
| `evaluating` | `boolean` | getter   | Whether an evaluation is in flight.      |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { computedAsync } from 'sv-utils';

	let userId = $state(1);
	const profile = computedAsync(() => fetchProfile(userId), null);
</script>

{#if profile.evaluating}
	<p>Loading…</p>
{:else if profile.value}
	<p>{profile.value.name}</p>
{/if}
```

### SSR behavior

Evaluates on mount (never on the server); the initial state renders on
the server. Must be called in component initialization.

## Edge cases & cleanup

- Overlapping runs resolve by generation: only the latest commits;
  superseded runs fire their `onCancel` hooks (cleanup also runs them on
  unmount).
- Synchronous throws inside the callback report via `onError` without
  touching state.
- Must be called in component initialization (evaluation in `$effect`).

## Parity notes

- Same race/cancel/error semantics; `evaluating` is returned (not passed
  in as a ref). No `lazy` option — lazy evaluation fights Svelte's
  mount-evaluated effects; use `useAsyncState({ immediate: false })` for
  deferred work. No `shallow`/`flush` options.
