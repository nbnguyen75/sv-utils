/**
 * Reactive difference of two arrays, with key / comparator / symmetric support.
 *
 * Inspired by [VueUse `useArrayDifference`](https://vueuse.org/shared/useArrayDifference/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */

import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';

/** Options for {@link useArrayDifference}. */
export interface UseArrayDifferenceOptions {
	/**
	 * Return items missing on either side instead of only `list - values`.
	 * @default false
	 */
	symmetric?: boolean;
}

/** Difference state returned by {@link useArrayDifference}. */
export interface UseArrayDifferenceReturn<T> {
	/** Items of `list` absent from `values` (plus the reverse when symmetric). Getter-backed (destructure-safe). */
	readonly value: T[];
}

export function useArrayDifference<T>(
	list: MaybeGetter<readonly T[]>,
	values: MaybeGetter<readonly T[]>,
	key?: keyof T,
	options?: UseArrayDifferenceOptions
): UseArrayDifferenceReturn<T>;
export function useArrayDifference<T>(
	list: MaybeGetter<readonly T[]>,
	values: MaybeGetter<readonly T[]>,
	compareFn?: (value: T, othVal: T) => boolean,
	options?: UseArrayDifferenceOptions
): UseArrayDifferenceReturn<T>;
export function useArrayDifference<T>(
	list: MaybeGetter<readonly T[]>,
	values: MaybeGetter<readonly T[]>,
	keyOrCompareFn?: unknown,
	options: UseArrayDifferenceOptions = {}
): UseArrayDifferenceReturn<T> {
	const { symmetric = false } = options;

	let compareFn: (value: T, othVal: T) => boolean = (value, othVal) => value === othVal;
	if (typeof keyOrCompareFn === 'function') {
		compareFn = keyOrCompareFn as (value: T, othVal: T) => boolean;
	} else if (
		typeof keyOrCompareFn === 'string' ||
		typeof keyOrCompareFn === 'number' ||
		typeof keyOrCompareFn === 'symbol'
	) {
		const key = keyOrCompareFn as keyof T;
		compareFn = (value, othVal) => value[key] === othVal[key];
	}

	const difference = $derived.by(() => {
		const resolved = resolveGetter(list);
		const others = resolveGetter(values);
		const missing = (from: readonly T[], against: readonly T[]): T[] =>
			from.filter((item) => against.findIndex((other) => compareFn(item, other)) === -1);
		const first = missing(resolved, others);
		return symmetric ? [...first, ...missing(others, resolved)] : first;
	});

	return {
		get value() {
			return difference;
		}
	};
}
