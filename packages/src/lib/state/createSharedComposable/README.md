# `createSharedComposable`

Shared singleton composable: one instance while mounted anywhere.
Inspired by [VueUse `createSharedComposable`](https://vueuse.org/shared/createSharedComposable/).

## Signature

```ts
import { createSharedComposable } from 'sv-utils';

const useSharedMouse = createSharedComposable(() => useMouse());
const mouse = useSharedMouse(); // same instance on the client
```

## Options

| Parameter    | Type                   | Default    | Description                                  |
| ------------ | ---------------------- | ---------- | -------------------------------------------- |
| `composable` | `(...args: Args) => R` | (required) | Factory whose first client result is reused. |

## Returns

A function returning the shared instance — or a fresh instance on the
server (state is never shared across SSR requests).

## Examples

### Basic usage

```ts
import { createSharedComposable } from 'sv-utils';

export const useSharedTheme = createSharedComposable(() => useTheme());
```

### SSR behavior

Every server call builds fresh (no cross-request leaks); the client builds
once and reuses. Safe to call during SSR.

## Edge cases & cleanup

- The client instance lives for the app lifetime: Vue's subscriber
  ref-counting has no Svelte equivalent, so reserve this for truly shared
  state (theme, mouse, session).

## Parity notes

- Same call shape; disposal-on-last-unsubscriber is the documented
  divergence (singletons persist instead).
