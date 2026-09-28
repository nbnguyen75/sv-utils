/**
 * Reactive `Array.every`.
 *
 * Inspired by [VueUse `useArrayEvery`](https://vueuse.org/shared/useArrayEvery/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */
import { resolveGetter } from '../getter/index.ts';
import type { MaybeGetter } from '../getter/index.ts';

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
