# `useCssSupports`

Reactive `CSS.supports()` query for property/value pairs or full
conditions.
Inspired by [VueUse `useCssSupports`](https://vueuse.org/core/useCssSupports/).

## Signature

```ts
import { useCssSupports } from 'sv-utils';

const grid = useCssSupports('display', 'grid');
const sticky = useCssSupports('(position: sticky)');
```

## Options

| Option     | Type             | Default  | Description                       |
| ---------- | ---------------- | -------- | --------------------------------- |
| `window`   | `Window \| null` | `window` | Window to query; `null` disables. |
| `ssrValue` | `boolean`        | `false`  | Value reported during SSR.        |

## Returns

`{ readonly isSupported: boolean }` — getter-backed.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useCssSupports } from 'sv-utils';

	const grid = useCssSupports('display', 'grid');
</script>

<div class:fallback={!grid.isSupported}>…</div>
```

### SSR behavior

`ssrValue` is reported on the server; on the client the live query
applies from the first read (same stance as this library's
`useMediaQuery` — no mount gate, so a server/client mismatch can flash
once on hydration if they disagree).

## Edge cases & cleanup

- A missing `CSS.supports` API reports `false` rather than throwing
  (upstream would throw on the missing namespace).
- The query is `$derived`, not `$state`+`$effect`: it re-runs on
  read whenever an input changes, with no mount flag to maintain.
- No listeners or observers are held; nothing to dispose beyond the
  component itself.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- The two call shapes (pair vs. condition) are typed overloads instead
  of `...args: any[]`; option-vs-value disambiguation is structural.
