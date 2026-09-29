import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Found state returned by {@link useArrayFind}. */
export interface UseArrayFindReturn<T> {
	/** First matching element, or `undefined`. Getter-backed (destructure-safe). */
	readonly value: T | undefined;
}

/**
 * Reactive `Array.find`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Predicate invoked per element.
 * @example
 * ```ts
 * const match = useArrayFind(users, (user) => user.id === 2);
 * match.value; // user | undefined
 * ```
 */
export function useArrayFind<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArrayFindReturn<T> {
	const found = $derived(resolveGetter(list).find(fn));

	return {
		get value() {
			return found;
		}
	};
}
