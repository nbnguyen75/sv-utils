# `useCssVar`

Manipulate a CSS variable reactively, in both directions: computed
styles flow in, assignments flow out.
Inspired by [VueUse `useCssVar`](https://vueuse.org/core/useCssVar/).

## Signature

```ts
import { useCssVar } from 'sv-utils';

const brand = useCssVar('--brand', () => card, { initialValue: 'red' });
brand.value = 'blue'; // writes card's inline style
```

## Options

| Option         | Type                                       | Default           | Description                                   |
| -------------- | ------------------------------------------ | ----------------- | --------------------------------------------- |
| `prop`         | `MaybeGetter<string \| null \| undefined>` | —                 | Variable name, e.g. `'--brand'`.              |
| `target`       | `MaybeElement`                             | `documentElement` | Element owning the variable.                  |
| `initialValue` | `string`                                   | —                 | Starting value until the first computed read. |
| `observe`      | `boolean`                                  | `false`           | Re-read on style/class mutations.             |

## Returns

`{ value: string | undefined }` — getter/setter-backed. Assign to
write the inline style; `undefined` removes the property.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useCssVar } from 'sv-utils';

	let card = $state<HTMLDivElement | null>(null);
	const brand = useCssVar('--brand', () => card);
</script>

<div bind:this={card} style:--brand={brand.value}>…</div>
<button onclick={() => (brand.value = 'blue')}>Blue</button>
```

### SSR behavior

Without a DOM nothing is read or written; `value` reports
`initialValue` (or `undefined`) on the server.

## Edge cases & cleanup

- Reads come from `getComputedStyle`, so inherited and stylesheet
  values are visible — not just inline ones.
- Switching the variable name removes the old property from the
  previous element before reading the new one.
- Assigning `undefined`/`null` removes the property instead of writing
  an empty value.
- With `observe: true`, external style/class mutations re-read the
  variable through a `MutationObserver`.
- The fallback read inside the watcher is `untrack`ed, so the effect
  observes only the element and the name — never the signal it writes
  (read/write aliasing would re-trigger it).
- The observer (when enabled) and effects dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse returns a writable ref; this port returns a getter/setter
  `value` with identical read/write call shapes.
