/**
 * Reactive `Array.find`.
 *
 * Inspired by [VueUse `useArrayFind`](https://vueuse.org/shared/useArrayFind/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */
import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

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
 */
export function useArrayFind<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArrayFindReturn<T> {
	const found = $derived(resolve(list).find(fn));

	return {
		get value() {
			return found;
		}
	};
}
