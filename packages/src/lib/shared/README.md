# `shared` — environment flags and type guards

Pure, SSR-safe predicates and helpers. Inspired by VueUse
`shared/utils/is`.

## Exports

| Export       | Signature                                                          | Description                                                             |
| ------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `isBrowser`  | `boolean` (const)                                                  | `window` and `document` both exist.                                     |
| `isClient`   | `boolean` (const)                                                  | Alias of `isBrowser`, kept for VueUse parity.                           |
| `isWorker`   | `boolean` (const)                                                  | Running inside a Web Worker scope.                                      |
| `isIOS`      | `boolean` (const)                                                  | iOS device (incl. desktop-mode iPad); frozen at import, `false` on SSR. |
| `isDef`      | `<T>(value: T \| undefined) => value is T`                         | Defined = not `undefined` (`null` counts as defined).                   |
| `notNullish` | `<T>(value: T \| null \| undefined) => value is T`                 | Neither `null` nor `undefined`.                                         |
| `assert`     | `(condition: boolean, ...infos: unknown[]) => void`                | `console.warn(...infos)` unless `condition` holds.                      |
| `isObject`   | `(value: unknown) => value is Record<string, unknown>`             | Plain objects only (no arrays, dates, functions).                       |
| `now`        | `() => number`                                                     | `Date.now()`.                                                           |
| `timestamp`  | `() => number`                                                     | `+Date.now()` (identical to `now()`; parity export).                    |
| `clamp`      | `(n, min, max: number) => number`                                  | Clamp into the inclusive range.                                         |
| `noop`       | `() => void`                                                       | No-operation placeholder.                                               |
| `rand`       | `(min, max: number) => number`                                     | Random integer in the inclusive range.                                  |
| `hasOwn`     | `<T extends object>(value: T, key: PropertyKey) => key is keyof T` | Own (non-inherited) property check.                                     |

## Examples

### Basic usage

```ts
import { clamp, isObject, notNullish } from 'sv-utils';

const width = clamp(raw, 0, 1024);
if (isObject(payload) && notNullish(payload.user)) {
	console.log(payload.user);
}
```

### SSR behavior

Importing this module has zero side effects beyond `typeof` checks — every
flag is safe to evaluate on the server (`isBrowser`/`isClient`/`isIOS` are
`false`, `isWorker` is `false`).

## Edge cases

- `isDef(null)` is `true` (only `undefined` is "not defined"); use
  `notNullish` to also exclude `null`.
- `isObject` rejects arrays, class instances with custom tags (dates,
  regexps), and functions.
- All flags are frozen at import time; they do not react to environment
  changes afterwards.

## Parity notes

- Strict-TypeScript adaptation of VueUse's guards: `unknown` predicates
  instead of `any`, `hasOwnProperty` instead of ES2022 `Object.hasOwn`
  (wider lib targets), `?? 0` on `maxTouchPoints`.
