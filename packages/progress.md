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
