# `useImage`

Reactively load an image: await the element or render a fallback.
Inspired by [VueUse `useImage`](https://vueuse.org/core/useImage/).

## Signature

```ts
import { useImage } from 'sv-utils';

const image = useImage(() => ({ src: photo.url }));
```

## Options

| Option              | Type                           | Description                                   |
| ------------------- | ------------------------------ | --------------------------------------------- |
| `options`           | `MaybeGetter<UseImageOptions>` | `<img>` attributes; reloads when they change. |
| `asyncStateOptions` | `UseAsyncStateOptions<…>`      | `delay`, `immediate`, `onError`, …            |

`UseImageOptions` mirrors `<img>` attributes: `src` (required),
`srcset`, `sizes`, `alt`, `class`, `loading`, `crossorigin`,
`referrerPolicy`, `width`, `height`, `decoding`, `fetchPriority`,
`ismap`, `usemap`.

## Returns

The full `useAsyncState` surface for `HTMLImageElement | undefined`:
`state`, `isLoading`, `isReady`, `error`, `execute`,
`executeImmediate`.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useImage } from 'sv-utils';

	const image = useImage(() => ({ src: photo.url, alt: photo.alt }));
</script>

{#if image.isLoading}
	<p>Loading…</p>
{:else if image.state}
	<img src={image.state.src} alt={photo.alt} />
{:else}
	<p>Could not load the image.</p>
{/if}
```

### SSR behavior

No image is constructed without a DOM; the state stays at its initial
value (`undefined`, not loading) on the server.

## Edge cases & cleanup

- Reloads whenever the resolved options change; only the latest
  execution settles the state.
- `immediate: false` stays idle until the options change or `execute()`
  is called manually.
- Rejections settle `error`/`isLoading` while `isReady` stays
  success-only (the `useAsyncState` contract).
- Images load with plain `onload`/`onerror` handlers on a detached
  element; nothing is inserted into the DOM and no listeners leak.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse re-executes through a deep watcher; this port re-executes
  through the options getter, so only values read inside the getter
  retrigger (narrower and cheaper than deep watching).
