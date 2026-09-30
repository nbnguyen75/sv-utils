# `useBase64`

Convert strings, blobs, buffers, canvases, images, and objects to
base64, re-converting when the target changes.
Inspired by [VueUse `useBase64`](https://vueuse.org/core/useBase64/).

## Signature

```ts
import { useBase64 } from 'sv-utils';

const { base64, execute } = useBase64(() => file);
```

## Overloads

| Target                                                       | Options                                            |
| ------------------------------------------------------------ | -------------------------------------------------- |
| `string \| Blob \| ArrayBuffer \| null \| undefined`         | `UseBase64Options` (`dataUrl`)                     |
| `HTMLCanvasElement \| HTMLImageElement \| null \| undefined` | `ToDataURLOptions` (`dataUrl`, `type`, `quality`)  |
| `object` (records, arrays, top-level `Map`/`Set`)            | `UseBase64ObjectOptions` (`dataUrl`, `serializer`) |

## Returns

| Field       | Type                                 | Reactive | Description                                       |
| ----------- | ------------------------------------ | -------- | ------------------------------------------------- |
| `base64`    | `string`                             | getter   | Latest output (data URL unless `dataUrl: false`). |
| `promise`   | `Promise<string> \| undefined`       | getter   | In-flight (or last) conversion.                   |
| `execute()` | `() => Promise<string> \| undefined` | method   | Convert the current target now.                   |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useBase64 } from 'sv-utils';

	let text = $state('hello');
	const { base64 } = useBase64(() => text);
</script>

<p>{base64}</p>
```

### File preview

```ts
const { base64, execute } = useBase64(() => pickedFile, { dataUrl: true });
// base64 is a data: URL ready for <img src>
```

### SSR behavior

`execute()` returns `undefined` without a DOM and the watcher never
runs on the server, so `base64` stays `''`.

## Edge cases & cleanup

- `null`/`undefined` targets resolve to `''` instead of throwing.
- Only top-level `Map`/`Set`/arrays get structural serializers;
  nested ones fall through to plain `JSON.stringify` (matching
  upstream) — pass `serializer` for custom shapes.
- Images are cloned with `crossOrigin = 'Anonymous'` before drawing to
  a canvas, so CORS-tainted sources fail loudly instead of silently.
- The exposed `promise` rejects for unsupported targets; always await
  or catch it to avoid unhandled rejections.
- No listeners or observers are held; nothing to dispose beyond the
  component itself.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse exposes eight narrow overloads; this port keeps three broad
  ones covering the same shapes with one example each.
- `quality` is typed `number` (upstream uses `any`).
