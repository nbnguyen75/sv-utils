# `useCloned`

Editable deep clone of a reactive source with a dirty flag.
Inspired by [VueUse `useCloned`](https://vueuse.org/core/useCloned/).

## Signature

```ts
import { useCloned } from 'sv-utils';

const { value, isModified, sync } = useCloned(() => original);
value.name = 'edited';
if (isModified) sync(); // discard edits
```

## Options

| Parameter | Type               | Default           | Description                                    |
| --------- | ------------------ | ----------------- | ---------------------------------------------- |
| `source`  | `MaybeGetter<T>`   | (required)        | Reactive source to clone.                      |
| `clone`   | `(source: T) => T` | `structuredClone` | Custom clone implementation.                   |
| `manual`  | `boolean`          | `false`           | Only sync via `sync()`; ignore source changes. |

## Returns

| Field        | Type         | Reactive        | Description                                   |
| ------------ | ------------ | --------------- | --------------------------------------------- |
| `value`      | `T`          | getter + setter | Editable clone (destructure-safe).            |
| `isModified` | `boolean`    | getter          | Whether the clone was edited since last sync. |
| `sync`       | `() => void` | method          | Re-clone from the source, clear the flag.     |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useCloned } from 'sv-utils';

	let original = $state({ name: 'ada' });
	const form = useCloned(() => original);
</script>

<input bind:value={form.value.name} />
<button onclick={() => form.sync()} disabled={!form.isModified}>Reset</button>
```

### SSR behavior

Clones once at creation without DOM access; safe during SSR. Source
tracking and dirty detection attach on mount and dispose with the
component.

## Edge cases & cleanup

- Nested source edits re-sync automatically (deep-tracked); nested clone
  edits raise `isModified`.
- Cloning snapshots the source first, so custom `clone` functions always
  receive plain data (never a reactive proxy).
- `structuredClone` preserves Dates, Maps, and Sets but throws on
  functions/symbols — pass a custom `clone` for exotic payloads.
- Both tracking effects dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Default clone is `structuredClone` instead of VueUse's
  `JSON.parse(JSON.stringify(...))` (superset: Dates/Maps survive).
  VueUse's `deep`/`immediate` watch options are unsupported — the initial
  sync always happens and tracking is always deep.
