import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Match state returned by {@link useArraySome}. */
export interface UseArraySomeReturn {
	/** `true` when any element passes. Getter-backed (destructure-safe). */
	readonly value: boolean;
}

/**
 * Reactive `Array.some`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Predicate invoked per element.
 * @example
 * ```ts
 * const any = useArraySome(users, (user) => user.admin);
 * any.value; // boolean
 * ```
 */
export function useArraySome<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArraySomeReturn {
	const some = $derived(resolveGetter(list).some(fn));

	return {
		get value() {
			return some;
		}
	};
}
