/**
 * Reactive unique array.
 *
 * Inspired by [VueUse `useArrayUnique`](https://vueuse.org/shared/useArrayUnique/).
 * The result is memoized in `$derived` and recomputes when reactive
 * dependencies of `list` change. Pure logic — safe to call anywhere,
 * including during SSR (no DOM access, no effects).
 */
import { resolveGetter } from '../getter/index.ts';
import type { MaybeGetter } from '../getter/index.ts';

/**
 * Equality predicate for {@link useArrayUnique}: return `true` when `a`
 * duplicates `b`.
 */
export type UseArrayUniqueCompareFn<T> = (a: T, b: T, array: readonly T[]) => boolean;

/** Unique state returned by {@link useArrayUnique}. */
export interface UseArrayUniqueReturn<T> {
	/** Deduplicated array (first occurrences win). Getter-backed (destructure-safe). */
	readonly value: T[];
}

function sameValueZero<T>(a: T, b: T): boolean {
	return a === b || Object.is(a, b);
}

function uniq<T>(array: readonly T[]): T[] {
	const out: T[] = [];
	for (const value of array) {
		if (!out.some((other) => sameValueZero(other, value))) out.push(value);
	}
	return out;
}
function uniqueElementsBy<T>(array: readonly T[], fn: UseArrayUniqueCompareFn<T>): T[] {
	return array.reduce<T[]>((acc, value) => {
		if (!acc.some((other) => fn(value, other, array))) acc.push(value);
		return acc;
	}, []);
}

/**
 * Reactive unique array.
 *
 * @param list Array, or a getter over reactive state.
 * @param compareFn Custom duplicate test; defaults to `Set` semantics.
 */
export function useArrayUnique<T>(
	list: MaybeGetter<readonly T[]>,
	compareFn?: UseArrayUniqueCompareFn<T>
): UseArrayUniqueReturn<T> {
	const unique = $derived.by(() => {
		const resolved = resolveGetter(list);
		return compareFn ? uniqueElementsBy(resolved, compareFn) : uniq(resolved);
	});

	return {
		get value() {
			return unique;
		}
	};
}
