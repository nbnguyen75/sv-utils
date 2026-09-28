/**
 * Reactive `Array.filter`.
 *
 * Inspired by [VueUse `useArrayFilter`](https://vueuse.org/shared/useArrayFilter/).
 * The result is memoized in `$derived` and recomputes when reactive
 * dependencies of `list` change. Pure logic — safe to call anywhere,
 * including during SSR (no DOM access, no effects).
 */

import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Filtered state returned by {@link useArrayFilter}. */
export interface UseArrayFilterReturn<T> {
	/** Elements passing the predicate. Getter-backed (destructure-safe). */
	readonly value: T[];
}

/**
 * Reactive `Array.filter`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Predicate invoked per element.
 */
export function useArrayFilter<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArrayFilterReturn<T> {
	const filtered = $derived(resolveGetter(list).filter(fn));

	return {
		get value() {
			return filtered;
		}
	};
}
