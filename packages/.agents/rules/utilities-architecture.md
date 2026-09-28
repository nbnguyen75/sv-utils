# Utilities & Composables Architecture Rules — svutils (VueUse Port)

`svutils` exists to bring modern, reactive utility and composable functions (mirroring VueUse) to Svelte 5 with runes.

## 1. Core Architecture & Ergonomics
- **Svelte 5 Runes**:
  - Use `$state` for reactive values. Use `$state.raw` for large data sets, immutable references, or DOM objects.
  - Use `$derived` and `$derived.by` for all computed/derived calculations.
  - Use `$effect` for side effects, subscriptions, event listeners, observers, and DOM lifecycle.
  - Always clean up subscriptions/listeners when the effect unmounts (return a cleanup function from `$effect`).
- **Reactive Getters & Object Ergonomics**:
  - When a composable returns multiple reactive values, return getter properties:
    ```ts
    export function useCounter(initialValue = 0) {
      let count = $state(initialValue);
      return {
        get count() { return count; },
        set count(v: number) { count = v; },
        inc: (delta = 1) => count += delta,
        dec: (delta = 1) => count -= delta,
        reset: () => count = initialValue
      };
    }
    ```
  - For complex state machines or multi-field controllers, implement a TypeScript class in `*.svelte.ts`.

## 2. SSR & Environment Safety
- **Universal Safety**:
  - Every utility must be safe for Server-Side Rendering (SvelteKit SSR).
  - Never access `window`, `document`, `navigator`, `localStorage`, `sessionStorage`, or other DOM APIs unconditionally at module evaluation or SSR time.
  - Use `typeof window !== 'undefined'` or check `isClient` helpers before accessing browser globals.
  - Return sensible default/fallback values during SSR.

## 3. Flexibility & Input Handling
- **Flexible Inputs**:
  - Allow arguments to be plain values, functions/getters, or reactive accessors: `type MaybeGetter<T> = T | (() => T)`.
  - Provide typed options objects with sensible defaults.
- **Manual Control**:
  - Utilities that listen to events, timers, or observers should expose explicit `pause()`, `resume()`, `stop()`, or `cleanup()` handles whenever appropriate.

## 4. Packaging & Modularity
- **Categories**:
  - `browser/` — DOM, window, storage, media, event listeners, clipboard, dark mode.
  - `state/` — Reactive state helpers, history, storage, debounced/throttled state.
  - `utilities/` — Async helpers, debounce, throttle, timing functions.
  - `shared/` — Common type helpers, type guards, math/array/object utils.
- **Strict Relative Imports**:
  - Inside `src/lib/`, always use relative imports (`./...` or `../...`). Do NOT use `$lib` path aliases in library code to ensure clean package distribution via `svelte-package`.
