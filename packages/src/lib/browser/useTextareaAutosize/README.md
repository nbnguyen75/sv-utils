# `useTextareaAutosize`

Auto-grow a textarea to fit its content, with an optional height cap.
Inspired by [VueUse `useTextareaAutosize`](https://vueuse.org/core/useTextareaAutosize/).

## Signature

```ts
import { useTextareaAutosize } from 'sv-utils';

const { triggerResize } = useTextareaAutosize({ element: () => area, input: () => draft });
```

## Options

| Option        | Type                                                    | Default      | Description                                |
| ------------- | ------------------------------------------------------- | ------------ | ------------------------------------------ |
| `element`     | `MaybeGetter<HTMLTextAreaElement \| null \| undefined>` | —            | Textarea to autosize.                      |
| `input`       | `MaybeGetter<string>`                                   | `''`         | Content; resizing re-runs when it changes. |
| `maxHeight`   | `number`                                                | —            | Maximum autosized height in pixels.        |
| `onResize`    | `() => void`                                            | —            | Called when the measured height changes.   |
| `styleTarget` | `MaybeGetter<HTMLElement \| null \| undefined>`         | the textarea | Element receiving the computed height.     |
| `styleProp`   | `'height' \| 'minHeight'`                               | `'height'`   | Style property manipulated for the height. |

## Returns

| Field             | Type                                       | Reactive | Description                       |
| ----------------- | ------------------------------------------ | -------- | --------------------------------- |
| `textarea`        | `HTMLTextAreaElement \| null \| undefined` | getter   | The textarea element.             |
| `input`           | `string`                                   | getter   | The input content.                |
| `triggerResize()` | `() => void`                               | method   | Measure and apply the height now. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useTextareaAutosize } from 'sv-utils';

	let area = $state<HTMLTextAreaElement | null>(null);
	let draft = $state('');

	useTextareaAutosize({ element: () => area, input: () => draft });
</script>

<textarea bind:this={area} bind:value={draft} rows="1"></textarea>
```

### Capped with a separate style target

```ts
const { triggerResize } = useTextareaAutosize({
	element: () => area,
	input: () => draft,
	maxHeight: 240,
	styleTarget: () => wrapper,
	styleProp: 'minHeight'
});
```

### SSR behavior

Without a DOM nothing is measured or styled; `triggerResize()` is a
safe no-op and the getters report their empty values.

## Edge cases & cleanup

- Measuring collapses the height to `1px` first so shrinkage is
  detected, then applies the capped `scrollHeight`.
- Resizing runs after the DOM settles (`tick()`), and skips detached
  textareas.
- Width changes (fonts, containers) re-trigger through a resize
  observer, via `requestAnimationFrame` when available.
- `onResize` fires only when the measured height actually changes —
  repeated identical measurements stay silent.
- The observer disposes with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse's `watch` option (arbitrary Vue watch sources) is dropped:
  pass every trigger as a reactive getter (`element`, `input`) and call
  `triggerResize()` for anything else.
- `input` is a read-only getter here rather than a two-way ref; bind
  the textarea value with Svelte's `bind:value` instead.
