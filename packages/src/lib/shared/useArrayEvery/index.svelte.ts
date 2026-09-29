import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Match state returned by {@link useArrayEvery}. */
export interface UseArrayEveryReturn {
	/** `true` when every element passes. Getter-backed (destructure-safe). */
	readonly value: boolean;
}

/**
 * Reactive `Array.every`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Predicate invoked per element.
 * @example
 * ```ts
 * const all = useArrayEvery(items, (item) => item.done);
 * all.value; // boolean
 * ```
 */
export function useArrayEvery<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArrayEveryReturn {
	const every = $derived(resolveGetter(list).every(fn));

	return {
		get value() {
			return every;
		}
	};
}
