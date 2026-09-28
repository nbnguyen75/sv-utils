/**
 * Reactive `Array.findLast` (manual reverse scan — no ES2023 dependency).
 *
 * Inspired by [VueUse `useArrayFindLast`](https://vueuse.org/shared/useArrayFindLast/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */

import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Found state returned by {@link useArrayFindLast}. */
export interface UseArrayFindLastReturn<T> {
	/** Last matching element, or `undefined`. Getter-backed (destructure-safe). */
	readonly value: T | undefined;
}

function findLast<T>(
	array: readonly T[],
	fn: (element: T, index: number, array: readonly T[]) => unknown
): T | undefined {
	let index = array.length;
	while (index > 0) {
		index -= 1;
		const element = array[index] as T;
		if (fn(element, index, array)) return element;
	}
	return undefined;
}

/**
 * Reactive `Array.findLast`.
 *
 * @param list Array, or a getter over reactive state.
 * @param fn Predicate invoked per element, scanned from the end.
 */
export function useArrayFindLast<T>(
	list: MaybeGetter<readonly T[]>,
	fn: (element: T, index: number, array: readonly T[]) => unknown
): UseArrayFindLastReturn<T> {
	const found = $derived.by(() => findLast(resolveGetter(list), fn));

	return {
		get value() {
			return found;
		}
	};
}
