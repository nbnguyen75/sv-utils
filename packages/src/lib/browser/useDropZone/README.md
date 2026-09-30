# `useDropZone`

Track file drops on an element or the document, with type validation.
Inspired by [VueUse `useDropZone`](https://vueuse.org/core/useDropZone/).

## Signature

```ts
import { useDropZone } from 'sv-utils';

const { files, isOverDropZone } = useDropZone(() => zone, {
	dataTypes: ['image'],
	onDrop: (dropped) => upload(dropped)
});
```

## Options

The second argument is either the options object or the `onDrop`
callback alone.

| Option                       | Type                                                           | Default | Description                                                 |
| ---------------------------- | -------------------------------------------------------------- | ------- | ----------------------------------------------------------- |
| `dataTypes`                  | `readonly string[] \| ((types: readonly string[]) => boolean)` | all     | Allowed types (substring match) or a predicate.             |
| `checkValidity`              | `(items: DataTransferItemList) => boolean`                     | —       | Custom check; takes precedence over `dataTypes`/`multiple`. |
| `onDrop`                     | `(files: File[] \| null, event: DragEvent) => void`            | —       | Called with the dropped files.                              |
| `onEnter` / `onLeave`        | `(files: File[] \| null, event: DragEvent) => void`            | —       | Called on drag enter/leave.                                 |
| `onOver`                     | `(files: File[] \| null, event: DragEvent) => void`            | —       | Called while hovering.                                      |
| `multiple`                   | `boolean`                                                      | `true`  | Allow multiple files.                                       |
| `preventDefaultForUnhandled` | `boolean`                                                      | `false` | Prevent default even for invalid drags.                     |

## Returns

| Field            | Type             | Reactive | Description                                 |
| ---------------- | ---------------- | -------- | ------------------------------------------- |
| `files`          | `File[] \| null` | getter   | Dropped files (`null` before a valid drop). |
| `isOverDropZone` | `boolean`        | getter   | Whether a valid drag hovers the zone.       |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useDropZone } from 'sv-utils';

	let zone = $state<HTMLDivElement | null>(null);
	const { files, isOverDropZone } = useDropZone(() => zone, { dataTypes: ['image'] });
</script>

<div bind:this={zone} class:over={isOverDropZone}>
	{#if files}
		<ul>
			{#each files as file (file.name)}
				<li>{file.name}</li>
			{/each}
		</ul>
	{:else}
		<p>Drop images here</p>
	{/if}
</div>
```

### Shorthand with a document-wide zone

```ts
const { files } = useDropZone(
	() => document,
	(dropped) => {
		if (dropped) uploadAll(dropped);
	}
);
```

### SSR behavior

Listeners are registered only in the browser. On the server `files`
stays `null` and `isOverDropZone` stays `false`.

## Edge cases & cleanup

- Enter/leave tracking uses a counter, so dragging over child elements
  (which fire extra `dragenter`/`dragleave` pairs) keeps the zone lit
  until the pointer truly leaves.
- Invalid drags get `dropEffect = 'none'` and are ignored (except on
  Safari, where the effect cannot be set reliably); `files` only updates
  on valid drops.
- With `multiple: false`, a multi-item drop is invalid and lands
  nothing; a single-item drop lands a one-element array.
- A function `dataTypes` is always the predicate form — getters are not
  supported there because the two are indistinguishable.
- All listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `onEnter`/`onLeave`/`onOver` receive `null` for files (not the hovered
  payload), matching upstream — only `onDrop` carries files.
- The state fields are getter-backed rather than refs, so destructuring
  stays reactive.
