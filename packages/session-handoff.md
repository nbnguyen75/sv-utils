# Session Handoff — svutils

## Current State

- Agent harness and linting stack fully configured in `packages/`.
- Svelte 5 utility library ported from VueUse with Bun, TypeScript, oxlint, oxfmt, eslint (with perfectionist sorting), and svelte-package.
- Initial utilities ported: `useEventListener`, `useDark`, `useClipboard`, `useScrollToTop`, `useStorage`, `useDebounceFn`, `useThrottleFn`, `is.ts`.

## Immediate Next Task

- Verify environment health with `.\init.ps1` (or `./init.sh`).
- Pick the next utilities from `feature_list.json` to port from VueUse (`D:\Personal\Project\vueuse\packages/core`).
- Recommended next items: `useMediaQuery`, `usePreferredDark`, `useWindowSize`, `useActiveElement`, `useDocumentVisibility`.

## How to Resume

1. Read `AGENTS.md` and `.agents/rules/`.
2. Run `.\init.ps1` to ensure environment passes all gates (`check`, `format`, `lint`, `prepack`).
3. Pick a utility to port and follow the `vue-to-svelte-analyze` and `vue-to-svelte-port` skills.
