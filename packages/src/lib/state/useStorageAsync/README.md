# `useStorageAsync`

Reactive async-storage cell with readiness tracking.
Inspired by [VueUse `useStorageAsync`](https://vueuse.org/core/useStorageAsync/).

## Signature

```ts
import { useStorageAsync } from 'sv-utils';

const settings = useStorageAsync('settings', defaults, idbBackend, {
	onReady: (value) => hydrate(value)
});
await settings; // first read settled
```

## Options

| Parameter                | Type                             | Default                      | Description                                            |
| ------------------------ | -------------------------------- | ---------------------------- | ------------------------------------------------------ |
| `key`                    | `string`                         | (required)                   | Storage key.                                           |
| `initialValue`           | `MaybeGetter<T>`                 | (required)                   | Fallback until the first read settles and on failures. |
| `storage`                | `AsyncStorageLike \| null`       | `localStorage` (browser)     | `{ getItem, setItem, removeItem }` backend.            |
| `serializer`             | `{ read; write }` (may be async) | JSON with string passthrough | Codec.                                                 |
| `writeDefaults`          | `boolean`                        | `true`                       | Write the default back when the key is absent.         |
| `listenToStorageChanges` | `boolean`                        | `true`                       | Re-read on cross-tab `storage` events.                 |
| `onError`                | `(error: unknown) => void`       | `console.error`              | Storage/codec failure hook.                            |
| `onReady`                | `(value: T) => void`             | —                            | First-read hook.                                       |

## Returns

| Field   | Type | Reactive        | Description                                                             |
| ------- | ---- | --------------- | ----------------------------------------------------------------------- |
| `value` | `T`  | getter + setter | Current value; assigning persists (`null`/`undefined` removes the key). |

The return is awaitable: `await` resolves a settled value view once the
first read finishes.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useStorageAsync } from 'sv-utils';
	import { idb } from './idb-backend';

	const settings = useStorageAsync('settings', { theme: 'light' }, idb);
	await settings;
</script>

<p>Theme: {settings.value.theme}</p>
```

### SSR behavior

Returns the default without touching storage on the server; reads once on
mount. Must be called in component initialization.

## Edge cases & cleanup

- Missing keys fall back to the default (written back when
  `writeDefaults`); failures fall back silently to `onError`.
- The cross-tab listener disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same read/write/remove/sync semantics with sync-or-async codecs. No
  `mergeDefaults` (niche partial-migration helper). Awaiting resolves a
  value view rather than the live cell, because a thenable resolving to
  itself can never settle.
