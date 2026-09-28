# `useStorage` (`useLocalStorage` / `useSessionStorage`)

Reactive `localStorage` / `sessionStorage`-backed state with cross-tab sync.
Inspired by [VueUse `useStorage`](https://vueuse.org/core/useStorage/).

## Signature

```ts
import { useLocalStorage, useSessionStorage } from 'sv-utils';

const name = useLocalStorage('name', 'anonymous');
name.value = 'ada';

const session = useSessionStorage('draft', { text: '' }, customSerializer);
```

## Options

| Parameter      | Type            | Default                      | Description                                             |
| -------------- | --------------- | ---------------------------- | ------------------------------------------------------- |
| `key`          | `string`        | (required)                   | Storage key.                                            |
| `defaultValue` | `T`             | (required)                   | Used when the key is absent, unreadable, or during SSR. |
| `serializer`   | `Serializer<T>` | JSON with string passthrough | `{ write(value): string; read(raw): T }` codec.         |

## Returns

| Field   | Type | Reactive        | Description                                      |
| ------- | ---- | --------------- | ------------------------------------------------ |
| `value` | `T`  | getter + setter | Current value; assigning persists write-through. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useLocalStorage } from 'sv-utils';

	const theme = useLocalStorage<'light' | 'dark'>('theme', 'light');
</script>

<button onclick={() => (theme.value = theme.value === 'light' ? 'dark' : 'light')}>
	Current: {theme.value}
</button>
```

### SSR behavior

Returns `defaultValue` on the server without reading or writing storage.
The client hydrates from storage on mount and persists write-through, so
prefer defaults that match the most common stored state to avoid
hydration flicker.

## Edge cases & cleanup

- Plain strings pass through unquoted; everything else is JSON-encoded.
  `read` failures (custom serializers) and storage failures (unavailable
  API, quota errors) fall back to the default instead of throwing.
- Cross-tab updates arrive via the `storage` event (same-key, non-null
  `newValue`); the listener disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Covers VueUse's `useStorage` + `useLocalStorage` + `useSessionStorage`;
  async backends live in `useStorageAsync` (feat-015). No `mergeDefaults`
  or shallow/ref variants — plain `$state` cells only.
