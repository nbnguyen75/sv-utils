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
