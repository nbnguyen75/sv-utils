# Migration Plan — VueUse → sv-utils

Source of truth for Vue logic: `D:\Personal\Project\vueuse\packages/`
(269 functions inventoried: core 148, shared 73, math 18, router 3,
integrations 12, rxjs 7, electron 5, firebase 3.)

Roadmap + statuses: `feature_list.json`. Session log: `progress.md`.

## 1. Scope: isomorphic only

Every port must work **with or without SvelteKit**:

- SSR-safe: no unconditional `window` / `document` / `navigator` /
  `localStorage` access at module scope; guard with `isBrowser`
  (`src/lib/shared/is.ts`) or run inside `$effect`; return sensible
  SSR fallbacks.
- No SvelteKit-only imports (`$app/*`). No framework-coupled APIs.
- Zero new runtime dependencies (vendored logic only).

### Wont-port (recorded in `feature_list.json`, do not re-propose)

| Group                  | Functions                                                                                                                                                                                                                                          | Reason                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| electron (5)           | `useIpcRenderer`, `useIpcRendererInvoke`, `useIpcRendererOn`, `useZoomFactor`, `useZoomLevel`                                                                                                                                                      | Electron runtime only                                           |
| firebase (3)           | `useAuth`, `useFirestore`, `useRTDB`                                                                                                                                                                                                               | Firebase SDK runtime                                            |
| router (3)             | `useRouteHash`, `useRouteParams`, `useRouteQuery`                                                                                                                                                                                                  | `vue-router`-coupled; SvelteKit equiv. needs `$app/*`           |
| rxjs (7)               | `from`, `toObserver`, `useExtractedObservable`, `useObservable`, `useSubject`, `useSubscription`, `watchExtractedObservable`                                                                                                                       | RxJS runtime                                                    |
| integrations (12)      | `useAsyncValidator`, `useAxios`, `useChangeCase`, `useCookies`, `useDrauu`, `useFocusTrap`, `useFuse`, `useIDBKeyval`, `useJwt`, `useNProgress`, `useQRCode`, `useSortable`                                                                        | Each adds a third-party dep; optional post-roadmap appendix     |
| Vue DI / template (12) | `computedInject`, `createInjectionState`, `provideLocal`, `injectLocal`, `createReusableTemplate`, `createTemplatePromise`, `useVModel`, `useVModels`, `useCurrentElement`, `useParentElement`, `useTemplateRefsList`, `createDisposableDirective` | Vue component/template model; no Svelte equivalent              |
| Vue refs (5)           | `createRef`, `toRef`, `toRefs`, `unrefElement`, `createUnrefFn`                                                                                                                                                                                    | Vue `ref`/`unref` model; Svelte uses `$state`/getters           |
| Vue lifecycle (6)      | `tryOnBeforeMount`, `tryOnBeforeUnmount`, `tryOnMounted`, `tryOnScopeDispose`, `tryOnUnmounted` (+ `tryOnScopeDispose`)                                                                                                                            | Replaced by `$effect` cleanup; document the pattern, don't port |

## 2. Popularity ordering

No per-function download stats exist, so tiers use a proxy:
everyday app needs → common DOM/sensor needs → specialized needs.
Within a tier, batches are dependency-ordered (foundations first).

- Tier 0 — done, needs retrofit (docs/tests + known fixes): `feat-002/003/004`.
- Tier 1 — state/timing essentials most apps import first.
- Tier 2 — everyday browser/DOM (viewport, elements, scroll, mouse, keyboard).
- Tier 3 — sensors/network/persistence/async.
- Tier 4 — page UI, animation, niche device APIs, math, type utils.

## 3. Per-module contract (every public util/hook)

Each port lives in `src/lib/<category>/<utilName>/` with exactly:

```
src/lib/<category>/<utilName>/
  index.ts             — public surface: Options/Return interfaces + re-export.
                         JSDoc on EVERY export (purpose, @param, @returns,
                         SSR behavior, VueUse parity notes / divergences).
  index.svelte.ts      — implementation, ONLY if runes are needed.
                         Pure logic stays in index.ts (testable w/o compiler).
  <utilName>.test.ts   — vitest suite (see §5). Colocated; excluded from dist
                         via package.json files/negation + prepack.
  README.md            — docs (see §4). Colocated so docs travel with code.
```

Categories: existing `browser/`, `state/`, `utilities/`, `shared/`.
Expand with `elements/`, `network/`, `sensors/` only when a batch
requires it — never pre-create empty folders.
Semantic fixes applied: `useDebounceFn`/`useThrottleFn` stay canonically in
`utilities/` (VueUse files them under shared; a dual `export *` from both
paths would make the export ambiguous and drop it, so the single
`utilities/` export stands — the filing deviation is noted in their
READMEs); `useScrollToTop` is **custom** (no VueUse equivalent) — its
README must say so.

`src/lib/index.ts` re-exports every module ( keeps `// * Category`
group comments).

## 4. Docs requirements (per public util)

`README.md` must contain, at minimum:

1. One-line purpose + VueUse source link (or `custom` label).
2. Signature block (import + call shape).
3. Options table (option, type, default, description) — all defaults stated.
4. Return table (field, type, reactivity note: getter-backed / method).
5. ≥2 runnable examples: basic usage + SSR note (what renders on server).
6. Edge cases & cleanup (`cancel`/`stop`/`flush`, unmount behavior).
7. Parity notes: any intentional divergence from VueUse (e.g. no Vue
   `MaybeRefOrGetter` — we use `MaybeGetter<T>`; no promise rejection on
   cancel unless documented).

JSDoc on exports must mirror the tables (reviewers read code, users read README).

No file-top banner comments: implementation files start with code
(imports). Every exported function — including each overload — carries
JSDoc with purpose, `@param`, `@returns`/`@default`, and a runnable
2–5 line `@example` fenced block, so IDE hovers teach usage without
opening the README.

## 5. Test requirements (per public util)

`<utilName>.test.ts` (vitest; `bun run test`) must cover **all cases as
possible**:

- [ ] Every public export is imported and exercised (no dead exports).
- [ ] Every option × default × non-default (incl. `leading`/`trailing`/
      `maxWait`, option omission).
- [ ] Timing via fake timers (`vi.useFakeTimers`); async via `flushPromises`.
- [ ] Browser APIs via jsdom + mocks (`matchMedia`, `clipboard`,
      `ResizeObserver`, `IntersectionObserver`); assert SSR fallback by
      importing in a node-env test (no `window`) and checking defaults.
- [ ] Cleanup: listeners/observers/timers removed on dispose
      (spy `removeEventListener`/`disconnect`/`clearTimeout`, or
      effect-scope dispose); unmount mid-flight (e.g. clipboard reset timer,
      scroll tween) leaves no stale writes.
- [ ] Controls: `cancel()`/`flush()`/`stop()`/`pause()`/`resume()` semantics,
      incl. double-cancel, flush-without-pending (no-op), cancel-then-reuse.
- [ ] Errors/unsupported: `copy()` without clipboard support is a safe no-op;
      storage quota/JSON-parse failures fall back to defaults.
- [ ] Parity cases ported from VueUse's own tests
      (`packages/shared/utils/index.test.ts` for filters) where applicable.

Pure-logic utils (debounce/throttle/array/math/guards) must be ≥90%
branch-coverable without the Svelte compiler (keep logic in `index.ts`).

## 6. Batch workflow (identical for every feat-xxx)

1. `vue-to-svelte-analyze` on `D:\Personal\Project\vueuse\packages/<pkg>/<fn>/index.ts`.
2. `vue-to-svelte-port` to Svelte 5 runes (getter-object returns,
   `MaybeGetter<T>` inputs, `isBrowser` guards, `$effect` cleanup,
   strict TS, relative imports only).
3. Write `README.md` (§4) then `<fn>.test.ts` (§5) — docs before tests so
   examples define expected behavior.
4. Run `bun run format:fix`, `bun run lint:fix`, `bun run check`,
   `bun run test --run`, `bun run prepack` (or `.\init.ps1` once it
   includes `test`).
5. Mark done in `feature_list.json` (evidence paths) + log in `progress.md`.
6. One batch at a time (phase-gate); prerequisite batches first.

## 7. Known fixes queued (not new scope)

- `feat-006`: `useDebounceFn` lodash-parity review — VueUse's
  `debounceFilter` (`shared/utils/filters.ts`) uses timestamp-based
  leading/trailing/`maxWait` semantics; our dual-timer version diverges on
  repeated-`leading` bursts and `maxWait+leading`. Align semantics
  (vendored, zero-dep), keep our `(fn, delay, options)` signature +
  `.cancel()/.flush()`; add missing `.pending()` only if load-bearing.
  `useThrottleFn` gains `.flush()`. Proven by parity tests ported from
  VueUse's filter tests.
- `feat-008` retrofit: `useClipboard` reset-timer disposed on unmount;
  `useScrollToTop` gains cancel + no stale writes mid-flight; docs+tests
  for all of `feat-002/003/004/007`.
- `feat-005` (first todo, blocks all implementation batches): add
  `vitest` + `jsdom`, `bun run test` script, colocated-test packaging
  exclusions, and wire `test` into `init.ps1`/`init.sh`.

## 8. Verification

Per-batch done = AGENTS.md Definition of Done **plus** §4 docs and §5
tests (README + test file exist, `bun run test` green, no uncovered
public export). `feature_list.json` `evidence` must cite implementation +
README + test paths.
