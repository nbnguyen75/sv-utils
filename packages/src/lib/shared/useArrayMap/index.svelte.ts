/**
 * Reactive `Array.map`.
 *
 * Inspired by [VueUse `useArrayMap`](https://vueuse.org/shared/useArrayMap/).
 * The result is memoized in `$derived` and recomputes when reactive
 * dependencies of `list` change. Pure logic — safe to call anywhere,
 * including during SSR (no DOM access, no effects).
 */
import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Mapped state returned by {@link useArrayMap}. */
export interface UseArrayMapReturn<T> {
	/** New array with each element mapped. Getter-backed (destructure-safe). */
	readonly value: T[];
}

/**
 * Reactive `Array.map`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Mapping invoked per element.
 */
export function useArrayMap<T, U>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => U
): UseArrayMapReturn<U> {
	const mapped = $derived(resolve(list).map(fn));

	return {
		get value() {
			return mapped;
		}
	};
}
