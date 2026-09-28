/**
 * Reactive `Array.findIndex`.
 *
 * Inspired by [VueUse `useArrayFindIndex`](https://vueuse.org/shared/useArrayFindIndex/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */

import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Found-index state returned by {@link useArrayFindIndex}. */
export interface UseArrayFindIndexReturn {
	/** Index of the first matching element, or `-1`. Getter-backed (destructure-safe). */
	readonly value: number;
}

/**
 * Reactive `Array.findIndex`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Predicate invoked per element.
 */
export function useArrayFindIndex<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArrayFindIndexReturn {
	const found = $derived(resolveGetter(list).findIndex(fn));

	return {
		get value() {
			return found;
		}
	};
}
