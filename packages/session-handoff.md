# Session Handoff — svutils

## Current State

- Agent harness and linting stack fully configured in `packages/`.
- Svelte 5 utility library ported from VueUse with Bun, TypeScript, oxlint, oxfmt, eslint (with perfectionist sorting), and svelte-package.
- Done through feat-010 (191/191 tests, 31 files; all gates green):
  harness (feat-005), debounce/throttle parity (feat-006), is-guards (feat-007),
  retrofit docs/tests/fixes (feat-008), state essentials (feat-009),
  reactive array utils (feat-010).

## Immediate Next Task

- Phase 1b: write `docs/recipes.md` (recipes for all `cut` functions,
  `deferred` lib adapters, `svelteNative` guidance, DnD trio) — then Phase 2
  refactor (R1 centralize MaybeGetter+resolve, R2 shared mount helper, R3
  UseXxxOptions normalization, R4 README re-check).
- After that resume at feat-011 (now 5 functions).

## How to Resume

1. Read `AGENTS.md` and `.agents/rules/`.
2. Run `.\init.ps1` to ensure environment passes all gates (`check`, `format`, `lint`, `prepack`).
3. Pick a utility to port and follow the `vue-to-svelte-analyze` and `vue-to-svelte-port` skills.
