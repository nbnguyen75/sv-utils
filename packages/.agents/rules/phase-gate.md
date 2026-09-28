# Phase Gate & Quality Gates — svbase

A primitive or feature is complete only when implementation, verification, and evidence all exist.

## 1. Single Active Focus
- Pick exactly ONE primitive or task from `feature_list.json` at a time.
- Do not jump ahead or implement unrequested features in parallel without explicit user instructions.

## 2. Gate Verification Requirements
Before marking any primitive as done:
1. **Type Check**: `bun run check` (svelte-check) passes with 0 errors and 0 warnings.
2. **Lint & Format**: `bun run lint` passes with 0 errors.
3. **Packaging / Build**: `bun run prepack` or `bun run build` succeeds without package or DTS generation errors.
4. **Svelte Autofixer**: Verified with `svelte-autofixer` tool or svelte best practices.
5. **Interactive Demo**: The primitive is mounted and demonstrated on the test/demo route (`docs/src/routes/+page.svelte` or sub-route) with keyboard and screen reader accessibility verified.
