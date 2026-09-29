# `syncRef`

Two-way synchronization between state cells.
Inspired by [VueUse `syncRef`](https://vueuse.org/shared/syncRef/).

## Signature

```ts
import { syncRef } from 'sv-utils';

const stop = syncRef(form, draft, {
	direction: 'both',
	transform: {
		ltr: (value) => value.trim(),
		rtl: (value) => value
	}
});
```

## Options

| Parameter   | Type                                              | Default    | Description                         |
| ----------- | ------------------------------------------------- | ---------- | ----------------------------------- |
| `left`      | `{ value: L }`                                    | (required) | Left cell (any getter/setter pair). |
| `right`     | `{ value: R }`                                    | (required) | Right cell.                         |
| `direction` | `'ltr' \| 'rtl' \| 'both'`                        | `'both'`   | Directions to install.              |
| `immediate` | `boolean`                                         | `true`     | Align the cells on mount.           |
| `transform` | `{ ltr?: (left: L) => R; rtl?: (right: R) => L }` | identity   | Per-direction conversions.          |

## Returns

`stop: () => void` — detach both directions permanently.

## Examples

### Basic usage

Any two getter/setter cells sync — including the `{ value }` objects
returned across this library:

```svelte
<script lang="ts">
	import { syncRef } from 'sv-utils';

	let celsius = $state(0);
	let fahrenheit = $state(32);

	syncRef(
		{
			get value() {
				return celsius;
			},
			set value(next: number) {
				celsius = next;
			}
		},
		{
			get value() {
				return fahrenheit;
			},
			set value(next: number) {
				fahrenheit = next;
			}
		},
		{
			transform: {
				ltr: (celsiusValue) => (celsiusValue * 9) / 5 + 32,
				rtl: (fahrenheitValue) => ((fahrenheitValue - 32) * 5) / 9
			}
		}
	);
</script>

### SSR behavior Aligns on mount only; nothing syncs on the server. Must be called in component
initialization. ## Edge cases & cleanup - Loop-breaking uses a sync window plus equality convergence
instead of VueUse's mutual pause; non-inverse transforms settle at the last write rather than
oscillating. - `stop()` detaches permanently; unmount disposal is automatic. - Must be called in
component initialization (uses `$effect`). ## Parity notes - Same directions/transforms/immediate
semantics with pragmatic option types (none of VueUse's set-theory conditional wizardry); cells
replace Vue refs.
```
