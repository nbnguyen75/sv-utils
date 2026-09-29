import type { MaybeGetter } from '../getter/index.ts';

import { resolveGetter } from '../getter/index.ts';
import { isObject } from '../is.ts';

/** Equality test for {@link useArrayIncludes}. */
export type UseArrayIncludesComparatorFn<T, V> = (
	element: T,
	value: V,
	index: number,
	array: readonly T[]
) => boolean;

/** Options for {@link useArrayIncludes}. */
export interface UseArrayIncludesOptions<T, V> {
	/** Comparator function or element key. Defaults to strict equality. */
	comparator?: UseArrayIncludesComparatorFn<T, V> | keyof T;
	/**
	 * Start searching at this index.
	 * @default 0
	 */
	fromIndex?: number;
}

/** Membership state returned by {@link useArrayIncludes}. */
export interface UseArrayIncludesReturn {
	/** Whether `value` was found. Getter-backed (destructure-safe). */
	readonly value: boolean;
}

/**
 * Reactive membership check with comparator, key, or from-index.
 * @example
 * ```ts
 * const known = useArrayIncludes(ids, 2);
 * known.value; // ids contains 2
 * ```
 */

export function useArrayIncludes<T, V>(
	list: MaybeGetter<readonly T[]>,
	value: MaybeGetter<V>,
	comparator?: UseArrayIncludesComparatorFn<T, V>
): UseArrayIncludesReturn;
export function useArrayIncludes<T, V>(
	list: MaybeGetter<readonly T[]>,
	value: MaybeGetter<V>,
	comparator?: keyof T
): UseArrayIncludesReturn;
export function useArrayIncludes<T, V>(
	list: MaybeGetter<readonly T[]>,
	value: MaybeGetter<V>,
	options?: UseArrayIncludesOptions<T, V>
): UseArrayIncludesReturn;
export function useArrayIncludes<T, V>(
	list: MaybeGetter<readonly T[]>,
	value: MaybeGetter<V>,
	comparatorOrOptions?: unknown
): UseArrayIncludesReturn {
	let fromIndex = 0;
	let comparator: UseArrayIncludesComparatorFn<T, V> = (element, val) =>
		element === (val as unknown as T);

	const byKey = (key: keyof T): void => {
		comparator = (element, val) => element[key] === val;
	};

	if (typeof comparatorOrOptions === 'function') {
		comparator = comparatorOrOptions as UseArrayIncludesComparatorFn<T, V>;
	} else if (
		typeof comparatorOrOptions === 'string' ||
		typeof comparatorOrOptions === 'number' ||
		typeof comparatorOrOptions === 'symbol'
	) {
		byKey(comparatorOrOptions as keyof T);
	} else if (isObject(comparatorOrOptions)) {
		const options = comparatorOrOptions as UseArrayIncludesOptions<T, V>;
		fromIndex = options.fromIndex ?? 0;
		if (typeof options.comparator === 'function') {
			comparator = options.comparator;
		} else if (
			typeof options.comparator === 'string' ||
			typeof options.comparator === 'number' ||
			typeof options.comparator === 'symbol'
		) {
			byKey(options.comparator);
		}
	}

	const included = $derived(
		resolveGetter(list)
			.slice(fromIndex)
			.some((element, index, array) => comparator(element, resolveGetter(value), index, array))
	);

	return {
		get value() {
			return included;
		}
	};
}
