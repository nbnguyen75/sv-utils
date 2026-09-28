# `getter` — `MaybeGetter` input pattern

Shared input convention: every util that accepts a plain value _or_ a
getter over reactive state takes `MaybeGetter<T>` and unwraps it with
`resolveGetter`.

## Signature

```ts
import { resolveGetter } from 'sv-utils';
import type { MaybeGetter } from 'sv-utils';

const value: MaybeGetter<number> = () => count();
resolveGetter(value); // re-resolves on every call
```

## Options

| Export           | Kind     | Description                                  |
| ---------------- | -------- | -------------------------------------------- |
| `MaybeGetter<T>` | type     | `T \| (() => T)` — value or getter.          |
| `resolveGetter`  | function | Unwrap: call functions, pass values through. |

## Returns

`resolveGetter` returns the unwrapped `T`.

## Examples

### Basic usage

```ts
import { resolveGetter } from 'sv-utils';
import type { MaybeGetter } from 'sv-utils';

function useDoubled(source: MaybeGetter<number>) {
	return {
		get value() {
			return resolveGetter(source) * 2;
		}
	};
}
```

### SSR behavior

Pure logic with no DOM access and no effects — safe during SSR. Getters
simply resolve to their server-side value.

## Edge cases & cleanup

- A function _value_ is indistinguishable from a getter — arrays of
  callbacks and similar payloads must be wrapped (e.g. `() => callbacks`).
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Replaces VueUse's `MaybeRefOrGetter`/`toValue` pair with a single
  framework-free convention used across every module.
