# Session Handoff — svutils

## Current State

- Agent harness and linting stack fully configured in `packages/`.
- Svelte 5 utility library ported from VueUse with Bun, TypeScript, oxlint, oxfmt, eslint (with perfectionist sorting), and svelte-package.
- Done through feat-019 (454/454 tests, 94 files; all gates green):
  harness (feat-005), debounce/throttle parity (feat-006), is-guards
  (feat-007), retrofit docs/tests/fixes (feat-008), state essentials
  (feat-009), reactive array utils (feat-010), elements (feat-011),
  timers/raf (feat-012), breakpoints/media/responsive (feat-013),
  device/visibility/text (feat-014), fullscreen/copy/paste (feat-015),
  lifecycle hooks (feat-016), storage/history (feat-017), async state
  (feat-018), scroll & mouse (feat-019).
- Repository-wide docs pass landed with feat-019: no file-top banner
  comments in `src/lib`, `@example` on every exported function overload,
  and matching rules in `AGENTS.md`, `.agents/rules/utilities-architecture.md`,
  and `migration-plan.md`.

## Immediate Next Task

- feat-020: gestures & drag. Check `feature_list.json` for the exact
  function set — `useDraggable` is deferred (documented in
  `docs/recipes.md`), so do not implement it here.
- Keep the two Svelte runes rules that feat-019 established: no read+write
  of the same signal in one effect, and no `$state` reads inside teardown
  cleanups (mirror disposal intent in plain variables).

## How to Resume

1. Read `AGENTS.md` and `.agents/rules/`.
2. Run `.\init.ps1` to ensure environment passes all gates (`check`, `format`, `lint`, `prepack`).
3. Pick a utility to port and follow the `vue-to-svelte-analyze` and `vue-to-svelte-port` skills.
