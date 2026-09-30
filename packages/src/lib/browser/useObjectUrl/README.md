# `useObjectUrl`

Reactive object URL for a blob or media source, revoked on change and
on disposal.
Inspired by [VueUse `useObjectUrl`](https://vueuse.org/useObjectUrl/).

## Signature

```ts
import { useObjectUrl } from 'sv-utils';

const url = useObjectUrl(() => file);
url.value; // blob:… URL, revoked automatically
```

## Options

A single argument: the blob or media source (or getter). `null` /
`undefined` clears the URL.

## Returns

`{ readonly value: string | undefined }` — the live object URL.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useObjectUrl } from 'sv-utils';

	let file = $state<File | null>(null);
	const url = useObjectUrl(() => file);
</script>

{#if url.value}
	<img src={url.value} alt="preview" />
{/if}
```

### SSR behavior

Without `URL.createObjectURL` the value stays `undefined` and nothing
is created or revoked.

## Edge cases & cleanup

- The previous URL is revoked before a new one is created, so rapid
  source swaps never leak.
- Disposal revokes the live URL even if the source never cleared.
- Revocation tracks a plain disposal mirror rather than reading the
  reactive value inside the effect (read+write aliasing would
  re-trigger forever).
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse returns a readonly ref; this port returns a getter-backed
  `{ value }`, so reads are identical and destructuring stays reactive.
