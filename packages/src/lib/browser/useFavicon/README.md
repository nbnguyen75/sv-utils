# `useFavicon`

Reactive favicon, applied to the document on change.
Inspired by [VueUse `useFavicon`](https://vueuse.org/core/useFavicon/).

## Signature

```ts
import { useFavicon } from 'sv-utils';

const icon = useFavicon('app.png');
icon.value = 'alert.png';
```

## Options

| Parameter | Type                                       | Default  | Description                                 |
| --------- | ------------------------------------------ | -------- | ------------------------------------------- |
| `newIcon` | `MaybeGetter<string \| null \| undefined>` | `null`   | Icon path, or a getter over reactive state. |
| `baseUrl` | `string`                                   | `''`     | Prefix prepended to icon paths.             |
| `rel`     | `string`                                   | `'icon'` | Link `rel` to match and create.             |

## Returns

| Field   | Type                          | Reactive        | Description                                           |
| ------- | ----------------------------- | --------------- | ----------------------------------------------------- |
| `value` | `string \| null \| undefined` | getter + setter | Current icon; assigning a string applies immediately. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useFavicon } from 'sv-utils';

	let unread = $state(0);
	const icon = useFavicon(() => (unread > 0 ? 'alert.png' : 'app.png'));
</script>
```

### SSR behavior

Reports the initial value on the server with no DOM access; applies on
mount. Must be called in component initialization.

## Edge cases & cleanup

- Always applies on mount (even when equal to the initial); afterwards
  only genuine changes apply.
- Reuses a matching `<link>` (updating `href` only — type stays as
  created) or creates one with `rel`, `href`, and an image `type` from
  the extension.
- `null`/`undefined` never touches the DOM.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same apply/update/create semantics with overloads for the
  options-bearing form; no `document` option.
