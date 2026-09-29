# `useNavigatorLanguage`

Reactive navigator language with support detection.
Inspired by [VueUse `useNavigatorLanguage`](https://vueuse.org/core/useNavigatorLanguage/).

## Signature

```ts
import { useNavigatorLanguage } from 'sv-utils';

const { isSupported, language } = useNavigatorLanguage();
language; // e.g. 'en-US'
```

## Options

None.

## Returns

| Field         | Type                  | Reactive | Description                                     |
| ------------- | --------------------- | -------- | ----------------------------------------------- |
| `isSupported` | `boolean`             | const    | Language API available (always `false` on SSR). |
| `language`    | `string \| undefined` | getter   | BCP 47 tag, refreshing on `languagechange`.     |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useNavigatorLanguage } from 'sv-utils';

	const { isSupported, language } = useNavigatorLanguage();
</script>

{#if isSupported}
	<p>{language}</p>
{/if}
```

### SSR behavior

Reports `{ isSupported: false, language: undefined }` on the server;
hydrates on mount. Must be called in component initialization.

## Edge cases & cleanup

- Disposal is automatic.

## Parity notes

- Direct port (no `window` option, per isomorphic rule).
