/**
 * `MaybeGetter` input pattern shared by every util that accepts either a
 * plain value or a getter over reactive state.
 *
 * Single canonical home for the type and its resolver (previously
 * copy-pasted per module). Importing this module has no side effects.
 */

/**
 * A plain value or a getter returning it. Getters re-resolve on every
 * read, so reactive dependencies stay tracked through `$derived`/`$effect`.
 */
export type MaybeGetter<T> = T | (() => T);

/**
 * Unwrap a {@link MaybeGetter}: call it when it is a function, return it
 * as-is otherwise.
 */
export function resolveGetter<T>(value: MaybeGetter<T>): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Element accepted by observer/element utils: the element itself (e.g.
 * from `bind:this`), a getter for late-bound elements, or nullish while
 * detached.
 */
export type MaybeElement = MaybeGetter<Element | null | undefined>;
