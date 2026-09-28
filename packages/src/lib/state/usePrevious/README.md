# `usePrevious`

Holds the value of a reactive source before its most recent change.
Inspired by [VueUse `usePrevious`](https://vueuse.org/core/usePrevious/).

## Signature

```ts
import { usePrevious } from 'sv-utils';

const previous = usePrevious(() => form.name);
const previousWithSeed = usePrevious(() => form.name, '');
```

## Options

| Parameter      | Type             | Default     | Description                                               |
| -------------- | ---------------- | ----------- | --------------------------------------------------------- |
| `source`       | `MaybeGetter<T>` | (required)  | Reactive source: a value or a getter over reactive state. |
| `initialValue` | `T`              | `undefined` | Value held until the source's first change.               |

## Returns

| Field   | Type             | Reactive | Description                                               |
| ------- | ---------------- | -------- | --------------------------------------------------------- |
| `value` | `T \| undefined` | getter   | Source value before its latest change (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePrevious } from 'sv-utils';

	let name = $state('ada');
	const previous = usePrevious(() => name);
</script>

<input bind:value={name} /><p>Was: {previous.value ?? '—'}</p>
```

### SSR behavior

Returns `initialValue` on the server and never touches the DOM. The first
client change after hydration populates the previous value. Works with or
without SvelteKit (no `$app/*`).

## Edge cases & cleanup

- Non-reactive sources never change, so the value stays at `initialValue`.
- Rapid successive changes collapse per flush: `previous` holds the last
  committed value before the latest flush, matching watcher semantics.
- Object sources compare by reference; the held snapshot is the exact
  (reactive) reference from before the swap.
- The sampling effect disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- The source is sampled in `$effect` (Vue's `watch` equivalent) with
  `untrack`ed bookkeeping; overloads mirror VueUse's with/without
  `initialValue` forms.
