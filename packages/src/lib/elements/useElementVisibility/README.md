# `useElementVisibility`

Viewport visibility of an element, with observer controls.
Inspired by [VueUse `useElementVisibility`](https://vueuse.org/core/useElementVisibility/).

## Signature

```ts
import { useElementVisibility } from 'sv-utils';

const visible = useElementVisibility(() => hero);
if (visible.value) track('hero-seen');
```

## Options

| Parameter      | Type                 | Default    | Description                                     |
| -------------- | -------------------- | ---------- | ----------------------------------------------- |
| `element`      | `MaybeElement`       | (required) | Target element or getter.                       |
| `initialValue` | `boolean`            | `false`    | Value until the first observation.              |
| `once`         | `boolean`            | `false`    | Stop after the first visible report.            |
| `threshold`    | `number \| number[]` | `0`        | Intersection ratio(s).                          |
| `rootMargin`   | `string`             | —          | Root margin.                                    |
| `scrollTarget` | `MaybeElement`       | —          | Scroll container used as the intersection root. |

## Returns

| Field                       | Type      | Reactive | Description                           |
| --------------------------- | --------- | -------- | ------------------------------------- |
| `value`                     | `boolean` | getter   | Currently visible (destructure-safe). |
| `isSupported`               | `boolean` | const    | `IntersectionObserver` exists here.   |
| `isActive`                  | `boolean` | getter   | Observation running.                  |
| `pause` / `resume` / `stop` | methods   | —        | Observer controls.                    |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useElementVisibility } from 'sv-utils';

	let hero: HTMLElement | null = null;
	const visible = useElementVisibility(() => hero, { once: true });
</script>

<section bind:this={hero}>
	{#if visible.value}
		<ExpensiveWidget />
	{/if}
</section>
```

### SSR behavior

Reports `initialValue` on the server; hydrates live on mount. Must be
called in component initialization.

## Edge cases & cleanup

- The latest entry wins when batches arrive.
- `once` stops tracking (disconnects) after the first `true`.
- Disposal is automatic.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- Always returns one uniform object (upstream returns either a bare ref
  or a controls object depending on flags).
