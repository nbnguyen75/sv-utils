# Ponytail & Simplification Rules — svbase

Strict rule: `ponytail` (minimalist, zero-bloat, simplest solution) and `ponytail-review` (over-engineering review) are enforced across all tasks.

## 1. The Simplification Ladder
Always stop at the first rung that holds:
1. **YAGNI**: If it's a speculative feature, skip it. Don't add config options or props until a primitive actually requires them.
2. **Reuse**: Check if an internal utility (e.g., id generation, context helper, keyboard handler) already exists in `packages/svbase/src/lib/` before writing new code.
3. **Standard Library / Native**: Use browser native primitives and WAI-ARIA standards before pulling third-party micro-libraries.
4. **Zero Runtime Dependencies**: Headless primitives should have minimal to zero external runtime dependencies. Svelte 5 built-in runes and DOM APIs are preferred. Sole standing exception (decided 2026-09-23): `@floating-ui/dom` for anchor positioning math only (offset/flip/shift/arrow) — never for component behavior (open state, delays, dismissal, focus all stay native). No Svelte wrapper lib on top of it.
5. **Minimal Working Code**: Write the shortest, clearest diff that provides complete accessibility, keyboard navigation, and unstyled functionality.

## 2. Review for Over-Engineering (`ponytail-review`)
- Before completing tasks, review changes specifically to eliminate unnecessary abstractions, complex nested contexts, premature factory functions, or dead wrapper components.
