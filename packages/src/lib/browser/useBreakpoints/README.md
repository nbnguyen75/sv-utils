# `useBreakpoints`

Reactive viewport breakpoints with shortcut queries and comparisons.
Inspired by [VueUse `useBreakpoints`](https://vueuse.org/core/useBreakpoints/).

## Signature

```ts
import { breakpointsTailwind, useBreakpoints } from 'sv-utils';

const breakpoints = useBreakpoints(breakpointsTailwind);
breakpoints.lg.value; // viewport >= 1024px (mobile-first default)
breakpoints.greater('lg').value; // strictly greater
breakpoints.isGreaterOrEqual('lg'); // sync check, no reactivity
breakpoints.current; // ['sm', 'md', ...] sorted matches
breakpoints.active; // highest match, '' when none
```

## Options

| Parameter     | Type                                          | Default       | Description                                        |
| ------------- | --------------------------------------------- | ------------- | -------------------------------------------------- |
| `breakpoints` | `Record<Name, MaybeGetter<number \| string>>` | (required)    | Name-to-width table (numbers are pixels).          |
| `strategy`    | `'min-width' \| 'max-width'`                  | `'min-width'` | Shortcut semantics: mobile-first vs desktop-first. |

Preset tables (`breakpointsTailwind`, `breakpointsBootstrapV5`,
`breakpointsVuetifyV2/V3`, `breakpointsAntDesign`, `breakpointsQuasar`,
`breakpointsSematic`, `breakpointsMasterCss`, `breakpointsPrimeFlex`,
`breakpointsElement`) are exported from the same module.

## Returns

| Field                                                                               | Type                    | Reactive | Description                                             |
| ----------------------------------------------------------------------------------- | ----------------------- | -------- | ------------------------------------------------------- |
| `[name]`                                                                            | media-query state       | getter   | Per-key shortcut under the strategy.                    |
| `current`                                                                           | `Name[]`                | getter   | Sorted matching names.                                  |
| `active`                                                                            | `Name \| ''`            | getter   | Highest (mobile-first) or lowest (desktop-first) match. |
| `greaterOrEqual` / `smallerOrEqual`                                                 | `(k) => query state     | methods  | Boundary-inclusive queries.                             |
| `greater` / `smaller`                                                               | `(k) => query state`    | methods  | Strict queries (0.1 offset, like upstream).             |
| `between`                                                                           | `(a, b) => query state` | methods  | `a` inclusive to `b` exclusive.                         |
| `isGreater` / `isGreaterOrEqual` / `isSmaller` / `isSmallerOrEqual` / `isInBetween` | `(…) => boolean`        | sync     | Immediate checks, no reactivity.                        |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { breakpointsTailwind, useBreakpoints } from 'sv-utils';

	const breakpoints = useBreakpoints(breakpointsTailwind);
</script>

{#if breakpoints.lg.value}
	<Sidebar />
{/if}
<p>Active tier: {breakpoints.active}</p>
```

### SSR behavior

All queries report `false` on the server (`current` is `[]`, `active` is
`''`); everything hydrates live on mount. There is no SSR width
evaluation — pick skeleton layouts that tolerate it. Query factories
(`greater`, `between`, …) install effects and must run in component
initialization, like the main call.

## Edge cases & cleanup

- Per-key shortcuts attach once at setup; dynamic factories subscribe on
  demand. Everything disposes on unmount.
- Values accept `MaybeGetter` (reactive tables) and CSS lengths (`'48em'`,
  still compared numerically by leading value for ordering).
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Same queries/offsets/presets (deprecated `breakpointsVuetify` alias not
  ported); no `window`/`ssrWidth` options. Sync `is*` predicates match
  upstream shapes.
