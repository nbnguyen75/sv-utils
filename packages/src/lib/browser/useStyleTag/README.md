# `useStyleTag`

Inject a `<style>` element into `<head>`, with ref-counted sharing.
Inspired by [VueUse `useStyleTag`](https://vueuse.org/core/useStyleTag/).

## Signature

```ts
import { useStyleTag } from 'sv-utils';

const { unload } = useStyleTag(() => `.theme { color: ${color}; }`);
```

## Options

| Option      | Type               | Default          | Description                                  |
| ----------- | ------------------ | ---------------- | -------------------------------------------- |
| `media`     | `string`           | —                | Media query the styles apply under.          |
| `immediate` | `boolean`          | `true`           | Load on mount.                               |
| `manual`    | `boolean`          | `false`          | Manual timing: skip auto load and unload.    |
| `id`        | `string`           | auto-incremented | DOM id of the tag (shared ids ref-count).    |
| `nonce`     | `string`           | —                | Nonce for Content Security Policy.           |
| `document`  | `Document \| null` | `document`       | Document receiving the tag; `null` disables. |

## Returns

| Field      | Type         | Reactive | Description                                            |
| ---------- | ------------ | -------- | ------------------------------------------------------ |
| `id`       | `string`     | static   | DOM id of the tag.                                     |
| `css`      | `string`     | getter   | Current CSS text.                                      |
| `load()`   | `() => void` | method   | Append the tag (idempotent) and apply the CSS.         |
| `unload()` | `() => void` | method   | Release the tag (removed after the last user unloads). |
| `isLoaded` | `boolean`    | getter   | Whether this instance holds the tag.                   |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useStyleTag } from 'sv-utils';

	let accent = $state('rebeccapurple');
	useStyleTag(() => `:root { --accent: ${accent}; }`);
</script>

<button onclick={() => (accent = 'tomato')}>Tomato</button>
```

### Manual lifecycle

```ts
const { load, unload, isLoaded } = useStyleTag(css, { manual: true, id: 'theme' });
```

### SSR behavior

Without a document nothing is created: `load()` is a safe no-op and
`isLoaded` stays `false`.

## Edge cases & cleanup

- Instances sharing an `id` ref-count the tag: the CSS follows the
  latest loader, and the element is removed only after the last
  `unload()`.
- Reactive CSS sources re-apply while loaded; the tag is created once
  and only its text changes.
- Non-manual instances unload on disposal.
- The load/unload pair runs `untrack`ed inside its effect: both read
  and write the loaded flag, and tracking them would ping-pong the
  effect with its own cleanup forever.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Tag ids use an `sv_styletag_` prefix rather than `vueuse_styletag_`.
- Removal uses `element.remove()` instead of `head.removeChild()`,
  which also covers tags moved out of `<head>`.
- `css` is a read-only view of the source: dynamic styles come from a
  reactive source getter rather than assignment.
