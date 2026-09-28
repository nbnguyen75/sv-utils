# Session Handoff — svutils

## Current State

- Agent harness and linting stack fully configured in `packages/`.
- Svelte 5 utility library ported from VueUse with Bun, TypeScript, oxlint, oxfmt, eslint (with perfectionist sorting), and svelte-package.
- Initial utilities ported: `useEventListener`, `useDark`, `useClipboard`, `useScrollToTop`, `useStorage`, `useDebounceFn`, `useThrottleFn`, `is.ts`.

## Immediate Next Task

- Start with `feat-005` (test & docs harness: vitest + jsdom, `bun run test`,
  init wiring) — blocks all implementation batches. Then `feat-006`
  (debounce/throttle parity) → `feat-007` (is-guards) → `feat-008`
  (retrofit docs/tests/fixes) → `feat-009` (state essentials).
- Per-batch contract: `migration-plan.md` §§3–6 (one batch at a time).

## How to Resume

1. Read `AGENTS.md` and `.agents/rules/`.
2. Run `.\init.ps1` to ensure environment passes all gates (`check`, `format`, `lint`, `prepack`).
3. Pick a utility to port and follow the `vue-to-svelte-analyze` and `vue-to-svelte-port` skills.
