# Progress — svutils

## Session Log

### Setup & Agent Harness Port

- [x] Ported Agent harness (`AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `skills-lock.json`).
- [x] Configured Svelte 5 rules (`utilities-architecture.md`, `typescript.md`, `phase-gate.md`, `ponytail.md`, `improve.md`).
- [x] Added VueUse-specific skills: `vue-to-svelte-analyze`, `vue-to-svelte-port`, `vueuse-functions`, `svelte-core-bestpractices`, `svelte-code-writer`, `typescript-advanced-types`, `modern-javascript-patterns`.
- [x] Ported modern linter and formatter stack: `oxlint.config.ts`, `oxfmt.config.ts`, `shared-ignore.config.js`, `eslint.config.js` (with `eslint-plugin-perfectionist`).
- [x] Added `init.ps1` and `init.sh` verification scripts.

### Migration planning (isomorphic VueUse → sv-utils)

- [x] Inventoried VueUse (`D:\Personal\Project\vueuse\packages`): 269 functions
      (core 148, shared 73, math 18, router 3, integrations 12, rxjs 7, electron 5, firebase 3).
- [x] Locked scope: isomorphic-only (SSR-safe, no `$app/*`, zero new runtime deps);
      39 functions across 8 groups recorded as wont-port (electron, firebase, router,
      rxjs, dep-heavy integrations, Vue DI/template, Vue refs, Vue lifecycle).
- [x] Rewrote `feature_list.json` v2.0.0: 28 popularity-ordered batched features
      (feat-001–feat-028) with per-batch function lists, VueUse sources, target dirs,
      dependencies, plus top-level module/docs/tests conventions and quality gates.
- [x] Wrote `migration-plan.md`: tiers, per-module contract
      (`index.ts` + `index.svelte.ts` + `<name>.test.ts` + `README.md`), docs §4 and
      tests §5 checklists, batch workflow, known fixes queue
      (feat-006 debounce parity, feat-008 retrofit, feat-005 test harness first).
- [x] Audited existing impls: `useEventListener`/`useDark`/`useStorage` solid;
      `useDebounceFn` is vendored lodash-style semantics (not a lodash import) with
      known dual-timer divergence → feat-006; `useClipboard` timer + `useScrollToTop`
      cancel fixes → feat-008; `is.ts` single-guard → feat-007 expansion.
- [x] No test runner / colocated tests / per-module docs exist yet → feat-005
      (vitest + jsdom, `bun run test`, init wiring) blocks all implementation batches.
- [x] Extended AGENTS.md Definition of Done with docs + tests gates.
- [x] `bun run format:fix` clean (also normalized pre-existing `.vscode/settings.json` whitespace drift).
- [x] `bun run check`: 0 errors; 1 pre-existing tsconfig warning (no svelte input
      files in include paths — baseline drift, untouched this session).
- [x] `bun run lint` and `bun run prepack` (svelte-package + publint) pass.

### feat-005: Test & docs harness — done

- [x] Installed `vitest@5.0.2` + `jsdom@30.1.1` (devDeps, `bun.lock` updated).
- [x] `vitest.config.ts`: svelte plugin (runes forced, mirrors `vite.config.ts`),
      node default env with per-file `// @vitest-environment jsdom` opt-in,
      `test/setup.ts`, include `src/**/*.test.ts` + `test/**/*.test.ts`.
- [x] Fixed bare-`svelte`-import resolution: Vitest externalizes `svelte` to Node
      (server build, `mount` throws) → `server.deps.inline: ['svelte']` plus
      `resolve.conditions` with `browser` first (client build everywhere).
- [x] `test/setup.ts`: controllable `matchMedia` stub (`setMediaMatches`) + per-test reset.
- [x] Smoke tests 6/6 green: node env (no DOM, runes fixture, fake timers on real
      `useDebounceFn`) + jsdom env (DOM globals, matchMedia stub, mount/unmount
      `$effect` cleanup pattern via fixture component).
- [x] `package.json`: `test` (`vitest run`) + `test:watch`; wired `bun run test`
      into `init.ps1`/`init.sh` between lint and prepack.
- [x] `docs/module-readme-template.md`: per-module README convention (§4).
- [x] Gates: `check` 0/0, `tsc --noEmit` clean, `lint` 0, `test` 6/6,
      `prepack` publint clean, `format` clean, `dist` contains no test files.

### feat-006: Debounce/throttle parity — done

- [x] Analyzed VueUse `debounceFilter`/`throttleFilter` (`shared/utils/filters.ts`):
      dual-timer like ours (not timestamp-based); VueUse debounce is trailing-only
      with `maxWait`, immediate invoke on `delay<=0`/`maxWait<=0`, `cancel`/`flush`/
      `isPending`; throttle is leading+trailing with per-call timer reset.
- [x] `useDebounceFn`: kept `(fn, delay, {leading, trailing, maxWait})` + explicit
      `DebouncedFunction` return type; added immediate-invoke path for
      `delay<=0`/`maxWait<=0`, `pending()` probe, full JSDoc. Verified our
      leading/trailing/maxWait interplay matches lodash/VueUse burst semantics.
- [x] `useThrottleFn`: kept signature + explicit `ThrottledFunction` return type;
      added `flush()` (pending trailing invokes now, no-op when idle); fixed
      `cancel()` to also drop stale `lastArgs`; full JSDoc.
- [x] Tests 21/21: `useDebounceFn.test.ts` (13: trailing/latest-args, defaults,
      window restart, leading±trailing, maxWait forcing + reuse, delay=0/maxWait=0
      immediate, cancel incl. maxWait burst + reuse, flush incl. no-ops, pending
      lifecycle) and `useThrottleFn.test.ts` (8: leading+trailing, leading:false,
      trailing:false, neither-edge VueUse-parity case, interval=0, cancel+reset,
      flush incl. no-ops). Two initial test expectations corrected to VueUse
      parity (trailing-fire boundary timing; post-window invoke with edges off).
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 27/27, `prepack`
      publint clean; `dist` test files excluded from pack via `files` negation.

### feat-007: Shared type guards expansion — done

- [x] Expanded `src/lib/shared/is.ts` to VueUse `shared/utils/is.ts` parity:
      `isBrowser` (kept) + `isClient` alias, `isWorker`, `isDef`, `notNullish`,
      `assert`, `isObject`, `now`, `timestamp`, `clamp`, `noop`, `rand`,
      `hasOwn`, `isIOS` (frozen at import, SSR-safe short-circuit).
- [x] Strict-TS adaptations (zero `any`): `unknown` predicates, `unknown[]`
      assert infos, `hasOwnProperty` instead of ES2022 `Object.hasOwn`,
      `?? 0` on `maxTouchPoints`, minimal local `WorkerGlobalScope` declaration
      (lib target lacks worker types — surfaced by `svelte-check`, fixed).
- [x] `src/lib/shared/is.test.ts` (10 tests: env flags, nullish semantics,
      assert warn/quiet, isObject matrix, time fns, clamp bounds, rand range
      sampling, own-vs-inherited props). Full suite 37/37 green.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, `prepack` publint clean.
      Per-module README for `shared/` lands in feat-008 retrofit.

### feat-008: Retrofit docs/tests/fixes — done

- [x] Fixes: `useClipboard` reset-timer disposed on unmount + alive-guard
      dropping in-flight copies that resolve after unmount (exported
      `UseClipboardOptions`/`UseClipboardReturn`); `useScrollToTop` gained
      `cancel()`, getter-backed `scrolling`, supersede-by-generation,
      unmount disposal, `UseScrollToTopReturn`; `useStorage` read/write
      try/catch fallbacks + `UseStorageReturn`; `useDark` got
      `UseDarkMode`/`UseDarkReturn`; `useEventListener` JSDoc + exported
      `MaybeGetter`; JSDoc on every export of all touched modules.
- [x] `test/fixtures/run.svelte`: shared mount harness running a setup
      callback inside `$effect` so `unmount` exercises disposal paths.
- [x] 5 suites, 35 tests: useEventListener (5: attach, unmount removal,
      element+once, nullish, document), useDark (8: defaults, OS follow,
      live media changes, toggle persistence, setMode/auto, restore,
      custom attribute, unmount silence), useClipboard (5: copy+reset,
      re-arm, unsupported no-op, timer dispose, in-flight drop),
      useScrollToTop (7: animate+resolve, cancel, supersede, idle cancel,
      null target, window default, unmount dispose), useStorage (10:
      defaults+write-through, JSON read, string passthrough, remount
      restore, custom serializer, throwing serializer/storage fallbacks,
      write-failure survival, storage-event sync, session isolation).
- [x] 8 READMEs per template (7 modules + `shared/`); scrubbed absolute
      local VueUse paths from all JSDoc (neutral attribution only).
- [x] Diagnosed two real issues via failing tests: jsdom `window instanceof
Window` is false across VM contexts → duck-typed window detection in
      `useScrollToTop` (also fixes cross-realm iframe windows); a throwing
      tween poisons Svelte's shared raf scheduler → fixed at the source,
      window test asserts last `scrollTo(0, 0)`.
- [x] Corrected migration-plan/feature_list: no dual `export *` re-export
      (ambiguous names would be silently dropped) — single canonical export.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 72/72
      (10 files), `prepack` publint clean.

### feat-009: State essentials — done

- [x] 8 ports in `src/lib/state/` (impl + test + README each, barrel wired):
      useToggle (7 tests), useCounter (7), usePrevious (4), useLastChanged (4),
      useCloned (7), useCycleList (6), useStepper (8), useOffsetPagination (11).
- [x] Vue `watch` → `$effect` + `untrack` bookkeeping (previous/lastChanged/
      cloned/list-sync/pagination callbacks); `structuredClone` default instead
      of JSON (Dates/Maps survive, documented); getter/setter objects instead
      of refs; no external two-way ref sync in pagination (callbacks instead);
      stepper `index` writable, cycle `index` read-only with `go()`.
- [x] `test/fixtures/box.svelte.ts`: reactive-box fixture so plain test files
      can drive `$effect`-tracked sources.
- [x] Fixed via failing tests: shared `Run` fixture now runs setup `untrack`ed
      (utils sampling reactive state at construction were re-created on every
      change); stepper `at/get/goTo` infinite self-recursion renamed;
      `$state` proxies are never identical to raw inputs (test corrected);
      pagination overloads steer on `total?: never` so unbounded usage drops
      `isLastPage` from the type.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 126/126
      (18 files), `prepack` publint clean.

### feat-010: Reactive array utils — done

- [x] 13 ports in `src/lib/shared/` (impl + test + README each, barrel wired):
      map (5 tests), filter (4), unique (5), some (3), every (3), includes (7),
      join (5), reduce (8), find (3), findIndex (3), findLast (3),
      difference (7), sorted (9).
- [x] All memoized in `$derived` over `MaybeGetter` lists — context-free and
      SSR-safe (only `dirty` sorted needs component init). Elements are opaque
      (no per-item getter resolution: `$state` proxies already track deeply).
- [x] Faithful edges: reduce overloads incl. function-seed quirk and native
      throw-on-empty; includes key/comparator/fromIndex (typo fixed vs VueUse's
      `formIndex` detection, number/symbol keys accepted); symmetric
      difference; manual reverse-scan findLast (no ES2023); sorted copy/dirty
      overloads with order-change guard so the in-place effect settles.
- [x] Fixed via failing tests: `$derived` laziness (callbacks only run on
      read); reduce index starts at 1 without seed (native); includes key mode
      compares against the scalar key value; `new Set` banned by
      `svelte/prefer-svelte-reactivity` → manual SameValueZero dedupe (NaN
      covered); reduce callback generics need the unknown-hop cast.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 191/191
      (31 files), `prepack` publint clean.

### feat-011: Timing core — done

- [x] 5 ports in `src/lib/utilities/` (impl + test + README each, barrel
      wired): useTimeoutFn (7 tests), useIntervalFn (6), useRafFn (7),
      useCountdown (7), useFps (4).
- [x] `$effect` + `untrack` replaces `tryOnScopeDispose`/`watch`;
      `MaybeGetter` interval/period/fpsLimit inputs; dropped the `window`
      option (global rAF only); countdown scheduler injectable with the same
      pause/resume/isActive shape; writable `remaining`.
- [x] `test/fixtures/raf.ts`: deterministic manual-frame rAF mock (explicit
      timestamps, no timers).
- [x] Fixed via failing tests: generic rest-tuple arity needs one shared
      `NO_ARGS` empty-tuple constant; `useIntervalFn` reactive restart
      requires a separate watcher effect (cleanup-then-check in one effect
      mistakes disposal for a stop and kills the timer — real bug caught);
      rAF capped first frame skips (VueUse parity); countdown `start()`
      resets (setter test uses `resume()`); `useFps` measures
      `performance.now`, not frame args (mocked clock); invalid intervals
      stop rather than leak the old cadence (documented divergence).
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 224/224
      (37 files), `prepack` publint clean.

### feat-013: Reactive watchers — done

- [x] 5 ports in `src/lib/state/` (impl + test + README each, barrel wired):
      watchArray (6 tests), watchAtMost (5), watchIgnorable (5),
      watchTriggerable (4), until (10).
- [x] `$effect` + `untrack` replaces `watch`; stopping is flag-based
      (effects cannot unsubscribe early); boolean-guard replaces VueUse's
      sync counters for silence (documented edges); `watchTriggerable`
      composes our `watchIgnorable`; `until` matchers install one-shot
      effects at call time (sync chain required) with timeout race.
- [x] Fixed via failing tests: non-immediate first run must not fire
      (watchAtMost); `until` needs skip-first mount run so counting
      conditions evaluate exactly once per change; `mountUtil` requires
      factories to return the API (block-body setups return stop); createBox
      generics for mixed-type boxes.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 254/254
      (42 files), `prepack` publint clean.

### feat-015: Async & history state — done

- [x] 9 ports in `src/lib/state/` (impl + test + README each, barrel wired):
      useAsyncState (8 tests), computedAsync (5), useAsyncQueue (5),
      useMemoize (5), useStorageAsync (7), useManualRefHistory (8),
      useRefHistory (7), useDebouncedRefHistory (1), useThrottledRefHistory (1).
- [x] Race safety by generation counters (async state + computed);
      `onCancel` hooks via effect cleanup; queue interruption/abort parity;
      history cells replace Vue refs; `structuredClone` default (with
      snapshot normalization — proxies read out of `$state` re-proxy on
      access and reject cloning); sync-window loop-breaking for cell sync.
- [x] Fixed via failing tests: `$state.raw` needs declaration position
      (dropped `shallow` — deep proxies are lazy anyway); awaiting a
      thenable that resolves to itself hangs by spec — `await` now resolves
      a fresh `then`-free snapshot view (same latent fix in storageAsync);
      object spread snapshots getter values (useRefHistory delegates);
      manual commits never double-fire (no guard needed); DataCloneError
      via nested proxies.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 329/329
      (60 files), `prepack` publint clean.

### feat-016: Viewport & media preferences — done

- [x] 10 ports in `src/lib/browser/` (impl + test + README each, barrel
      wired): useMediaQuery (6 tests), usePreferredDark (1),
      usePreferredColorScheme (1), useBreakpoints (6), useWindowSize (5),
      usePreferredReducedMotion (1), usePreferredLanguages (2),
      usePreferredContrast (1), usePreferredReducedTransparency (1),
      useTextDirection (5); +1 generic-target test for useEventListener.
- [x] `useMediaQuery` foundation with re-subscribing reactive queries and
      `ssrMatches` fallback (no `ssrWidth` machinery); eager breakpoint
      shortcuts; duck-typed window handling throughout; framework presets
      ported (deprecated alias dropped); no `window`/`document` options
      anywhere per isomorphic rule.
- [x] Fixed via failing tests: effect-scope `matchMedia` needs the same
      try/catch as the initial read (async throw = unhandled error);
      breakpoint query factories install effects (build in setup).
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 360/360
      (71 files), `prepack` publint clean.

### feat-017: Elements — done (new `elements/` category)

- [x] 9 ports in `src/lib/elements/` (impl + test + README each, barrel
      wired with a `// * Elements` group): useResizeObserver (6 tests),
      useMutationObserver (4), useIntersectionObserver (7),
      useElementVisibility (4), useElementSize (6), useElementBounding (8),
      useActiveElement (3), useFocus (5), useFocusWithin (2); +`isElement`
      guard in `shared/is.ts` with jsdom tests.
- [x] `test/fixtures/observers.ts`: controllable Resize/IntersectionObserver
      mocks (instance registries, per-target triggers, init capture).
- [x] Duck-typed element checks everywhere (`nodeType` + shape, never
      `instanceof` — cross-realm failures proven earlier); eager breakpoint-
      style shortcuts where keys are known; native jsdom MutationObserver
      used directly.
- [x] Fixed via failing tests: `exactOptionalPropertyTypes` needs
      conditional init building; empty-interface rule → type aliases;
      effect-flush `tick()` required after `resume()`; jsdom matches
      `:focus-visible`; `stop()`-then-trigger and unmount paths.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 406/406
      (81 files), `prepack` publint clean.

### feat-018: Document & page UI — done

- [x] 5 ports in `src/lib/browser/` (impl + test + README each, barrel
      wired): useDocumentVisibility (1 test), useWindowFocus (1),
      usePageLeave (1), useFavicon (4), useFullscreen (3).
- [x] Fullscreen vendor-prefix detection via capability probing (`in`
      operator — zero `any` casts / `ts-expect-error`s); per-name listener
      loop (our listener takes single events, not arrays); enter-exits-first
      ordering parity; mocked-API tests cover the whole state machine.
- [x] Fixed via failing tests: favicon needs first-run application
      (equality guard skips mount); existing links keep `type` (parity).
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 416/416
      (86 files), `prepack` publint clean.

### feat-014: Ref variants & shared state — done

- [x] 8 ports in `src/lib/state/` (impl + test + README each, barrel wired):
      refAutoReset (5 tests), refManualReset (3), refWithControl (4),
      createEventHook (3), createGlobalState (2), createSharedComposable (2),
      syncRef (5), computedWithControl (4).
- [x] No Vue `customRef`/`effectScope` in Svelte: auto-timers use disposal
      effects; `silentSet`/`lay` dropped as impossible (writes always notify,
      documented); shared-composable disposal degrades to documented
      app-lifetime singleton (fresh per SSR call); `syncRef` loop-breaking
      via sync-window flag + equality convergence; `computedWithControl`
      via epoch counter.
- [x] Pure modules (eventHook/globalState/sharedComposable) live directly
      in `index.ts` per the no-runes convention.
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 282/282
      (51 files), `prepack` publint clean.

### feat-012: Date/time display — done (recipes-only, no code)

- [x] Verified `docs/recipes.md` dates section covers all four deferred
      functions (date-fns ticker/format recipe, `Intl.RelativeTimeFormat`
      recipe, Temporal stabilization note). Evidence recorded; no
      implementation per scope review.

### Scope review: roadmap 150+ → ~110 ports (v2.1.0)

- [x] Policy locked: core strictly zero-dep; integrations-last may use
      peerDeps (never bundled); vendor-copy semantics where tiny (mitt-style);
      cut rule = user-implementable in <10 lines with no edge cases.
- [x] `feature_list.json` v2.0.0 → v2.1.0 via scripted transform
      (`feat210.mjs`): 39 `cut`, 6 `deferred`, 4 `svelte-native`; done entries
      untouched (38 done).
- [x] Rescoped batches: feat-011 (9→5), feat-012 (recipes-only, date-fns),
      feat-013 (13→5), feat-014 (13→8), feat-015 (−useCached), feat-016
      (−useSSRWidth), feat-018 (−useTitle), feat-020 (−useDraggable),
      feat-025 (8→4), feat-027 (18→4), feat-028 (12→6).
- [x] New top-level sections: `cut` (7 groups → docs/recipes.md), `deferred`
      (7 groups → lib links), `svelteNative` (4 → Svelte guidance),
      `integrationsLast` (3 adapters + 9 recipes-only); old integrations
      wont-port group superseded.
- [x] New feat-029 (svbase ports, 10 fns) and feat-030 (integration adapters
      last, 3 fns). DnD = recipes only (sortablejs + @dnd-kit/svelte snapshot
      pattern + neodrag; svelte-dnd-action excluded). better-fetch/RPC dropped
      for now — parked, revisit after publish.

### docs/recipes.md — done

- [x] Recipes for every `cut` group (timing, watchers, refs, async, viewport,
      math, shared), every `deferred` entry (date-fns, Temporal, neodrag,
      tanstack-virtual, sortablejs, dnd-kit snapshot, qrcode/change-case/jwt,
      nprogress/cookies/focus-trap/drauu/async-validator), `svelteNative`
      guidance (title/transitions/animate/mounted), and feat-030 adapter
      shapes (axios/fuse/idb-keyval). Fixed two snippets that used `await`
      inside `$derived` (invalid) → `$effect` + alive-guard patterns.

### Phase 2 refactor — done

- [x] R1: centralized `MaybeGetter` + `resolve` (22 copy-pasted copies) into
      new `src/lib/shared/getter/` (`resolveGetter` + type, own test + README,
      barrel-wired); single canonical export (dual `export *` would silently
      drop the name — same hazard as feat-008). All 22 sites rewired via
      script; `check` clean.
- [x] R2: new `test/fixtures/mount.ts` (`mountSetup` + `mountUtil<T>`);
      migrated all 11 jsdom suites (one-line wrappers replace ~20-line
      helpers); bodies keep direct `tick()` for mid-test flushes.
- [x] R3: normalized type names (`DebounceOptions`→`UseDebounceOptions`,
      `ThrottleOptions`→`UseThrottleOptions`,
      `DebouncedFunction`→`UseDebouncedFunction`,
      `ThrottledFunction`→`UseThrottledFunction`,
      `Serializer`→`UseStorageSerializer`, `StepName`→`UseStepName`) across
      src/test/docs via word-boundary script; progress.md history untouched.
- [x] R4: README sweep — all modules carry the 7 template sections except
      `shared/README.md`, accepted as a 15-export index (export table covers
      Signature/Options/Returns content).
- [x] Gates: `format`/`lint`/`check` (0/0) clean, full suite 193/193
      (32 files), `prepack` publint clean.

### Housekeeping: module docblock placement (partial, parked)

- [x] Moved displaced module `/** */` docblocks back to file top with a
      blank-line separator across implementation modules (formatter-induced
      drift from the R1 import rewiring).
- [ ] Parked before completion (strand sweep + full suite re-run unfinished);
      committed as-is with `check`/`format` green.
