# `createGlobalState`

Application-wide singleton state from a factory.
Inspired by [VueUse `createGlobalState`](https://vueuse.org/shared/createGlobalState/).

## Signature

```ts
import { createGlobalState } from 'sv-utils';

const useStore = createGlobalState(() => ({ count: 0 }));
const store = useStore(); // same instance everywhere
```

## Options

| Parameter      | Type                   | Default    | Description                    |
| -------------- | ---------------------- | ---------- | ------------------------------ |
| `stateFactory` | `(...args: Args) => R` | (required) | Builds the state on first use. |

## Returns

The memoized factory: first call builds, later calls (anywhere) return
the same instance. Later-call arguments are ignored.

## Examples

### Basic usage

In a `.svelte.ts` module (runes require one):

```ts
// theme.svelte.ts
import { createGlobalState } from 'sv-utils';

export const useTheme = createGlobalState(() => {
	let mode = $state('light');
	return {
		get mode() {
			return mode;
		},
		toggle() {
			mode = mode === 'light' ? 'dark' : 'light';
		}
	};
});
```

```svelte
<script lang="ts">
	import { useTheme } from './theme.svelte.ts';

	const theme = useTheme(); // same instance in every component
</script>

### SSR behavior Lazy and DOM-free; safe to import during SSR. Note the shared caveat: module
singletons persist across SSR requests — keep request-scoped data out of global state (same caveat
as upstream). ## Edge cases & cleanup - The factory runs exactly once; nothing to dispose. ## Parity
notes - Same lazy-singleton shape without Vue's effect scope (unneeded — plain memoization suffices
outside components).
```
