/**
 * Reactive sorted array, copy-on-read by default or in-place with `dirty`.
 *
 * Inspired by [VueUse `useSorted`](https://vueuse.org/core/useSorted/).
 * Pure `$derived` logic — safe to call anywhere, including during SSR —
 * except `dirty` mode, which sorts the source in place inside `$effect`
 * and therefore needs component initialization.
 */
import { untrack } from 'svelte';

import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Comparison for {@link useSorted}. */
export type UseSortedCompareFn<T> = (a: T, b: T) => number;

/** Sort implementation for {@link useSorted}. */
export type UseSortedFn<T> = (arr: T[], compareFn: UseSortedCompareFn<T>) => T[];

/** Options for {@link useSorted}. */
export interface UseSortedOptions<T> {
	/**
	 * Custom sort implementation.
	 * @default (arr, compareFn) => arr.sort(compareFn)
	 */
	sortFn?: UseSortedFn<T>;
	/**
	 * Custom comparison. The default subtracts (numbers).
	 */
	compareFn?: UseSortedCompareFn<T>;
	/**
	 * Sort the source array in place instead of returning a sorted copy.
	 * Requires component initialization.
	 * @default false
	 */
	dirty?: boolean;
}

/** Sorted state returned by {@link useSorted}. */
export interface UseSortedReturn<T> {
	/** Sorted array (a copy, or the mutated source in `dirty` mode). Getter-backed (destructure-safe). */
	readonly value: T[];
}

const defaultNumericCompare = (a: number, b: number): number => a - b;
const defaultSort = <T>(source: T[], compareFn: UseSortedCompareFn<T>): T[] =>
	source.sort(compareFn);

export function useSorted<T>(
	source: MaybeGetter<T[]>,
	compareFn?: UseSortedCompareFn<T>
): UseSortedReturn<T>;
export function useSorted<T>(
	source: MaybeGetter<T[]>,
	options?: UseSortedOptions<T>
): UseSortedReturn<T>;
export function useSorted<T>(
	source: MaybeGetter<T[]>,
	compareFn?: UseSortedCompareFn<T>,
	options?: Omit<UseSortedOptions<T>, 'compareFn'>
): UseSortedReturn<T>;
export function useSorted<T>(
	source: MaybeGetter<T[]>,
	compareFnOrOptions?: unknown,
	maybeOptions?: unknown
): UseSortedReturn<T> {
	let compareFn: UseSortedCompareFn<T> = defaultNumericCompare as unknown as UseSortedCompareFn<T>;
	let options: UseSortedOptions<T> = {};

	if (typeof compareFnOrOptions === 'function') {
		compareFn = compareFnOrOptions as UseSortedCompareFn<T>;
		if (maybeOptions !== undefined) options = maybeOptions as UseSortedOptions<T>;
	} else if (compareFnOrOptions !== undefined) {
		options = compareFnOrOptions as UseSortedOptions<T>;
		if (options.compareFn) compareFn = options.compareFn;
	}

	const { dirty = false, sortFn = defaultSort } = options;

	if (dirty) {
		$effect(() => {
			const current = resolve(source);
			untrack(() => {
				const result = sortFn([...current], compareFn);
				// Splice only on real order changes so the effect settles
				// instead of re-triggering itself.
				const changed =
					result.length !== current.length ||
					result.some((item, index) => !Object.is(item, current[index]));
				if (changed) current.splice(0, current.length, ...result);
			});
		});
	}

	const sorted = $derived(dirty ? resolve(source) : sortFn([...resolve(source)], compareFn));

	return {
		get value() {
			return sorted;
		}
	};
}
