# AGENTS.md

Project harness for reliable agent-assisted development on **svutils**
(TypeScript + Svelte 5 utility library package, Bun-managed).

svutils is a comprehensive collection of essential Svelte 5 utilities and composables,
bringing the reactivity, power, and developer experience of **VueUse** (`D:\Personal\Project\vueuse`) to the Svelte 5 ecosystem using modern Runes.

---

## Repository Layout

- `packages/` (or current package root) — the publishable library (`src/lib`, `prepack`/`publint`) and its self-contained harness (this AGENTS.md, `.agents/`, `.claude/`, `init.*`, `feature_list.json`, `skills-lock.json`, `eslint`/`oxfmt`/`oxlint` configs). Strict relative imports only within `src/lib/`.
- `src/lib/` — categorized composables and utilities:
  - `src/lib/browser/` — Browser/DOM utilities (`useEventListener`, `useDark`, `useClipboard`, `useScrollToTop`, etc.)
  - `src/lib/state/` — Reactive state helpers (`useStorage`, `useRefHistory`, `useAsyncState`, etc.)
  - `src/lib/utilities/` — Timing and control helpers (`useDebounceFn`, `useThrottleFn`, `useInterval`, etc.)
  - `src/lib/shared/` — Type guards, predicates, math, and core helpers (`is.ts`, etc.)
- Source of truth for Vue original logic: `D:\Personal\Project\vueuse/packages/`

---

## Startup Workflow

Before writing any code:

1. **Confirm working directory** with `pwd`
2. **Read this file** completely
3. **Read project rules** in `.agents/rules/`:
   - `utilities-architecture.md` — Svelte 5 runes reactivity, getters/classes, SSR guards, listener cleanups
   - `typescript.md` — strict TypeScript rules, exported interfaces, zero `any`
   - `ponytail.md` — simplification ladder, zero bloat, YAGNI, standard DOM before custom JS
   - `phase-gate.md` — done criteria: implementation + verification + evidence
   - `improve.md` — quality and architecture standards
4. **Run `.\init.ps1`** (or `./init.sh` on bash) to verify environment health
5. **Read `feature_list.json`** to see roadmap status and identify the next utility function to port
6. **Review recent commits** with `git log --oneline -5`

If baseline verification fails, repair it before adding new scope.

---

## Standard Package Commands

Always use the standard npm/bun scripts configured in `package.json` for validation and formatting:

| Command                    | Action                         | Underlying Tool                              |
| -------------------------- | ------------------------------ | -------------------------------------------- |
| `bun run check`            | Typecheck components & modules | `svelte-check`                               |
| `bun run check:watch`      | Watch mode typecheck           | `svelte-check --watch`                       |
| `bun run format`           | Verify formatting compliance   | `oxfmt --check`                              |
| `bun run format:fix`       | Format codebase automatically  | `oxfmt`                                      |
| `bun run lint`             | Lint codebase for errors       | `oxlint && eslint src --ext .svelte --cache` |
| `bun run lint:fix`         | Autofix lint issues            | `oxlint --fix && eslint src --fix --cache`   |
| `bun run prepack`          | Package verification & build   | `svelte-package && publint`                  |
| `.\init.ps1` / `./init.sh` | Full baseline environment run  | Dependencies, check, format, lint, prepack   |

---

## Working Rules

- **One utility at a time**: Pick exactly one unfinished utility from `feature_list.json`.
- **Svelte 5 Runes Only**: Use `$state`, `$derived`, `$derived.by`, `$effect`, `$bindable`.
- **Reactive Return Values**: Expose reactive state via getter properties (`get value() { return state; }`) or state classes so destructuring doesn't lose reactivity.
- **SSR & Browser Guards**: Every DOM/browser API access must check `typeof window !== 'undefined'` or run safely inside `$effect`.
- **Zero Memory Leaks**: Always return cleanup functions or provide `.stop()` / `.cleanup()` methods for event listeners, observers, and timers.
- **Strict TypeScript**: Export options and return types for each utility from its module folder (`index.ts`). No `any`, no `@ts-ignore`.
- **Relative Imports Inside `src/lib/`**: Never use `$lib` path aliases inside `src/lib/` — `svelte-package` does not rewrite aliases in `.d.ts` / `.js` files.
- **Formatting & Linting First**: Use `bun run format:fix` and `bun run lint:fix` during editing.
- **Verification Required**: Never claim a task is complete without running `.\init.ps1` (or `bun run check && bun run format && bun run lint && bun run prepack`).
- **Update Artifacts**: Update `feature_list.json` and `progress.md` at each milestone.

---

## Svelte MCP Tools & Available Agents

When working with Svelte code, use the Svelte MCP tools:

1. `list-sections`: Discover available Svelte 5 / SvelteKit documentation sections.
2. `get-documentation`: Fetch full documentation for runes and patterns (`$state`, `$derived`, `$props`, `snippets`, etc.).
3. `svelte-autofixer`: Analyze Svelte code to detect issues before finalizing.

---

## Skill Routing

Load the most specific skill for the task:

| Task / Domain                 | Skill                                                     |
| ----------------------------- | --------------------------------------------------------- |
| Vue / VueUse Logic Analysis   | `vue-to-svelte-analyze`                                   |
| VueUse to Svelte 5 Porting    | `vue-to-svelte-port`                                      |
| VueUse Function Reference     | `vueuse-functions`                                        |
| Svelte 5 Reactivity & Runes   | `svelte-core-bestpractices`, `svelte-code-writer`         |
| Modern JS / TypeScript Types  | `modern-javascript-patterns`, `typescript-advanced-types` |
| Simplification & Minimal Code | `ponytail` (always active)                                |
| Quality & Architecture        | `improve` (always active)                                 |
| Refactoring & Code Smells     | `refactor`                                                |
| Research & Documentation      | `research`, `writing-for-agents`                          |

---

## Required Artifacts

- `feature_list.json` — Source of truth for roadmap and feature completion
- `migration-plan.md` — Isomorphic scope, popularity tiers, per-module docs/tests contract, batch workflow
- `progress.md` — Session log with verifiable checkmarks and status
- `init.sh` / `init.ps1` — Standard baseline verification scripts
- `session-handoff.md` — Context handoff for next agent session

---

## Definition of Done

A utility is done only when:

- [ ] Implementation is complete and faithfully reproduces the VueUse utility behavior in Svelte 5
- [ ] Safe for SSR (`typeof window !== 'undefined'` checks in place)
- [ ] All event listeners, observers, and timers are cleaned up on disposal
- [ ] Public options and return interfaces are exported from its module and `src/lib/index.ts`
- [ ] Docs: `src/lib/<category>/<name>/README.md` per `migration-plan.md` §4 + JSDoc with `@example` on every exported function (each overload too); no file-top banner comments — documentation lives on exports, not file headers
- [ ] Tests: `src/lib/<category>/<name>/<name>.test.ts` per `migration-plan.md` §5, `bun run test` green, no uncovered public export
- [ ] `bun run check` passes with 0 errors and 0 warnings
- [ ] `bun run format` passes with 0 errors
- [ ] `bun run lint` passes with 0 errors
- [ ] `bun run prepack` builds dist and passes `publint` with 0 errors
- [ ] Evidence recorded in `feature_list.json` and `progress.md`

---

## End of Session Routine

1. Run verification (`.\init.ps1` or `./init.sh`).
2. Mark completed features in `feature_list.json`.
3. Log changes and remaining questions in `progress.md`.
4. Update `session-handoff.md` with immediate next steps.
