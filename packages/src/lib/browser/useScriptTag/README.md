# `useScriptTag`

Load an external script exactly once per instance, with load/error
tracking.
Inspired by [VueUse `useScriptTag`](https://vueuse.org/core/useScriptTag/).

## Signature

```ts
import { useScriptTag } from 'sv-utils';

const { load } = useScriptTag('https://example.com/widget.js', () => init());
await load(); // resolves once loaded
```

## Options

| Option           | Type                               | Default             | Description                                  |
| ---------------- | ---------------------------------- | ------------------- | -------------------------------------------- |
| `immediate`      | `boolean`                          | `true`              | Load on mount.                               |
| `manual`         | `boolean`                          | `false`             | Manual timing: skip auto load and unload.    |
| `async`          | `boolean`                          | `true`              | `async` attribute.                           |
| `type`           | `string`                           | `'text/javascript'` | Script type.                                 |
| `crossOrigin`    | `'anonymous' \| 'use-credentials'` | —                   | CORS mode.                                   |
| `referrerPolicy` | `ReferrerPolicy`                   | —                   | Referrer policy.                             |
| `noModule`       | `boolean`                          | —                   | `nomodule` attribute.                        |
| `defer`          | `boolean`                          | —                   | `defer` attribute.                           |
| `attrs`          | `Record<string, string>`           | `{}`                | Extra attributes.                            |
| `nonce`          | `string`                           | —                   | Nonce for Content Security Policy.           |
| `document`       | `Document \| null`                 | `document`          | Document receiving the tag; `null` disables. |

## Returns

| Field       | Type                                                     | Reactive | Description                                            |
| ----------- | -------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `scriptTag` | `HTMLScriptElement \| null`                              | getter   | The script element once known.                         |
| `load()`    | `(waitForScriptLoad?: boolean) => Promise<… \| boolean>` | method   | Load (singleton); resolves `false` without a document. |
| `unload()`  | `() => void`                                             | method   | Remove the tag and forget it.                          |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useScriptTag } from 'sv-utils';

	const { load } = useScriptTag('https://example.com/widget.js');

	$effect(() => {
		load().then((element) => {
			if (element !== false) console.log('ready', element.src);
		});
	});
</script>
```

### SSR behavior

Without a document `load()` resolves `false` and nothing is created.

## Edge cases & cleanup

- `load()` is a per-instance singleton: concurrent calls share one
  promise, and a second call after `unload()` starts over.
- An existing tag with the same `src` is reused; one already marked
  `data-loaded` resolves immediately without new listeners.
- `load(false)` resolves right after appending, without waiting for
  the `load` event.
- Failures reject with the native `error`/`abort` event.
- Unlike `useEventListener`-based code, the element listeners here are
  raw with `{ once }`-style explicit removal, because `load()` runs
  post-mount where `$effect` would be an orphan — and each path
  (resolve, reject, early return) detaches them.
- Non-manual instances unload on disposal.
- The mount effect runs `untrack`ed: `load()`/`unload()` both touch the
  tag state, and tracking them would ping-pong the effect with its own
  cleanup (same hazard as `useStyleTag`).
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Removal uses `element.remove()` instead of `head.removeChild()`,
  which also covers tags moved elsewhere.
- `referrerPolicy` uses the DOM `ReferrerPolicy` union instead of an
  inline literal list.
