# `useMemoize`

Argument-keyed function result cache.
Inspired by [VueUse `useMemoize`](https://vueuse.org/core/useMemoize/).

## Signature

```ts
import { useMemoize } from 'sv-utils';

const getUser = useMemoize((id: number) => fetchUser(id));
getUser(7); // computes
getUser(7); // cached
getUser.load(7); // recompute + refresh
```

## Options

| Parameter  | Type                                  | Default                | Description                                          |
| ---------- | ------------------------------------- | ---------------------- | ---------------------------------------------------- |
| `resolver` | `(...args: Args) => Result`           | (required)             | Function whose results are cached.                   |
| `getKey`   | `(...args: Args) => string \| number` | `JSON.stringify(args)` | Key derivation.                                      |
| `cache`    | `UseMemoizeCache<unknown, Result>`    | `Map`                  | Custom `{ get, set, has, delete, clear }` container. |

## Returns

| Field         | Type                                  | Description                      |
| ------------- | ------------------------------------- | -------------------------------- |
| (call)        | `(...args: Args) => Result`           | Cached call (computes on miss).  |
| `load`        | `(...args: Args) => Result`           | Recompute and refresh the entry. |
| `delete`      | `(...args: Args) => void`             | Drop one entry.                  |
| `clear`       | `() => void`                          | Drop all entries.                |
| `generateKey` | `(...args: Args) => string \| number` | Key derivation.                  |
| `cache`       | container                             | Underlying cache.                |

## Examples

### Basic usage

```ts
import { useMemoize } from 'sv-utils';

const search = useMemoize((query: string) => index.search(query), {
	getKey: (query) => query.toLowerCase()
});
```

### SSR behavior

Framework-free with no DOM access and no effects — safe anywhere,
including SSR. Each render gets an independent cache.

## Edge cases & cleanup

- Non-serializable arguments need a custom `getKey` (default keys collide
  on key order and drop functions/symbols like `JSON.stringify` does).
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Same API with strict cache types (no `any` keys). The cache is a plain
  container — reactivity comes from callers re-invoking, not the cache.
