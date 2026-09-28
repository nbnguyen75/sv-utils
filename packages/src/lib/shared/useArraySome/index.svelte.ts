/**
 * Reactive `Array.some`.
 *
 * Inspired by [VueUse `useArraySome`](https://vueuse.org/shared/useArraySome/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */
import { resolveGetter } from '../getter/index.ts';
import type { MaybeGetter } from '../getter/index.ts';

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
