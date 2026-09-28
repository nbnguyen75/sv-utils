# `useLastChanged`

Records the timestamp of a reactive source's last change.
Inspired by [VueUse `useLastChanged`](https://vueuse.org/shared/useLastChanged/).

## Signature

```ts
import { useLastChanged } from 'sv-utils';

const changed = useLastChanged(() => form.draft);
const stamped = useLastChanged(() => form.draft, { immediate: true });
```

## Options

| Parameter      | Type                   | Default    | Description                                               |
| -------------- | ---------------------- | ---------- | --------------------------------------------------------- |
| `source`       | `MaybeGetter<unknown>` | (required) | Reactive source: a value or a getter over reactive state. |
| `immediate`    | `boolean`              | `false`    | Stamp the mount time instead of starting empty.           |
| `initialValue` | `number \| null`       | `null`     | Starting value.                                           |

## Returns

| Field   | Type             | Reactive | Description                                     |
| ------- | ---------------- | -------- | ----------------------------------------------- |
| `value` | `number \| null` | getter   | Epoch ms of the last change (destructure-safe). |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useLastChanged } from 'sv-utils';

	let draft = $state('');
	const changed = useLastChanged(() => draft);
</script>

<textarea bind:value={draft}></textarea>
{#if changed.value}
	<p>Edited {new Date(changed.value).toLocaleTimeString()}</p>
{/if}
```

### SSR behavior

Returns `initialValue` (`null` by default) on the server without touching
the DOM. Mounting does not stamp unless `immediate: true`.

## Edge cases & cleanup

- Non-reactive sources never change; the value stays at its initial stamp.
- The sampling effect disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse's `WatchOptions` (`deep`, `flush`, etc.) are intentionally
  unsupported — sampling always runs in a default `$effect`. `immediate`
  and `initialValue` keep their VueUse meanings.
