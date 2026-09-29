# `usePreferredLanguages`

Reactive navigator languages.
Inspired by [VueUse `usePreferredLanguages`](https://vueuse.org/core/usePreferredLanguages/).

## Signature

```ts
import { usePreferredLanguages } from 'sv-utils';

const languages = usePreferredLanguages();
languages.value; // readonly string[], e.g. ['en-US', 'en']
```

## Options

None.

## Returns

| Field   | Type                | Reactive | Description                              |
| ------- | ------------------- | -------- | ---------------------------------------- |
| `value` | `readonly string[]` | getter   | Preferred locales, most preferred first. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePreferredLanguages } from 'sv-utils';

	const languages = usePreferredLanguages();
</script>

<p>Locale: {languages.value[0] ?? 'en'}</p>
```

### SSR behavior

Reports `['en']` on the server; hydrates from `navigator.languages` on
mount. Must be called in component initialization.

## Edge cases & cleanup

- Refreshes on `languagechange`; disposal is automatic.

## Parity notes

- Direct port (no `window` option, per isomorphic rule).
