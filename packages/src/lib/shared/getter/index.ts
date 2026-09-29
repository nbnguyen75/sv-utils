/**
 * A plain value or a getter returning it. Getters re-resolve on every
 * read, so reactive dependencies stay tracked through `$derived`/`$effect`.
 */
export type MaybeGetter<T> = T | (() => T);

/**
 * Unwrap a {@link MaybeGetter}: call it when it is a function, return it
 * as-is otherwise.
 * @example
 * ```ts
 * resolveGetter(source); // call it if it is a function, else pass through
 * ```
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
