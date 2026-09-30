# `useClipboardItems`

Reactive Clipboard API for rich items (`ClipboardItem` payloads such as
images and formatted text).
Inspired by [VueUse `useClipboardItems`](https://vueuse.org/core/useClipboardItems/).

## Signature

```ts
import { useClipboardItems } from 'sv-utils';

const { copy, copied, content } = useClipboardItems();
await copy([new ClipboardItem({ 'text/plain': blob })]);
```

## Options

| Option         | Type                                       | Default | Description                              |
| -------------- | ------------------------------------------ | ------- | ---------------------------------------- |
| `read`         | `boolean`                                  | `false` | Refresh `content` on copy/cut events.    |
| `source`       | `MaybeGetter<ClipboardItems \| undefined>` | —       | Default content for bare `copy()` calls. |
| `copiedDuring` | `number`                                   | `1500`  | Milliseconds until `copied` resets.      |
| `navigator`    | `Navigator \| null`                        | global  | Navigator to use; `null` disables.       |

## Returns

| Field         | Type                                                                     | Reactive | Description                            |
| ------------- | ------------------------------------------------------------------------ | -------- | -------------------------------------- |
| `isSupported` | `boolean`                                                                | static   | Whether the Clipboard API exists here. |
| `content`     | `ClipboardItems`                                                         | getter   | Last written or read items.            |
| `copied`      | `boolean`                                                                | getter   | Whether the last write is still fresh. |
| `copy`        | `(content: ClipboardItems) => Promise<void>` (or optional with `source`) | method   | Write items.                           |
| `read()`      | `() => void`                                                             | method   | Read the clipboard into `content` now. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useClipboardItems } from 'sv-utils';

	const { copy, copied } = useClipboardItems();

	async function copyImage(blob: Blob) {
		await copy([new ClipboardItem({ [blob.type]: blob })]);
	}
</script>

<button onclick={() => copyImage(blob)}>
	{copied ? 'Copied!' : 'Copy image'}
</button>
```

### Reading the clipboard

```ts
const { content, read } = useClipboardItems({ read: true });
// `content` refreshes on every copy/cut, or call read() manually
```

### SSR behavior

Without a clipboard, `isSupported` is `false`, `copy()` resolves
without writing, and `content` stays empty.

## Edge cases & cleanup

- `copy()` with no items (bare call without `source`, or an explicit
  `null`/`undefined`) resolves without touching the clipboard.
- `copied` resets through a re-arming timeout, so rapid successive
  copies keep the flag lit for the full window after the last one.
- The copy/cut refresh listeners are only registered with `read: true`
  and dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- For plain text, prefer the lighter `useClipboard`; this utility is
  for rich `ClipboardItem` payloads.
- The state fields are getter-backed rather than refs, so destructuring
  stays reactive.
