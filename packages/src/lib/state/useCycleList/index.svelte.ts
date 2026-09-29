import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Options for {@link useCycleList}. */
export interface UseCycleListOptions<T> {
	/**
	 * Custom index lookup.
	 * @default (value, list) => list.indexOf(value)
	 */
	getIndexOf?: (value: T, list: T[]) => number;
	/**
	 * Initial value. Defaults to the first list item.
	 */
	initialValue?: T | (() => T);
	/**
	 * Index used when the current value is not found in the list.
	 * @default 0
	 */
	fallbackIndex?: number;
}

/** Cycling state returned by {@link useCycleList}. */
export interface UseCycleListReturn<T> {
	/** Index of the current item (falls back per options). Getter-backed. */
	readonly index: number;
	/** Move forward `n` places with wraparound. Returns the new item. */
	next(n?: number): T;
	/** Move backward `n` places with wraparound. Returns the new item. */
	prev(n?: number): T;
	/** Jump to index `i` (wraps out-of-range indices). Returns the new item. */
	go(i: number): T;
	/** Current item. Getter/setter-backed (destructure-safe). */
	value: T;
}

/**
 * Cycle through `list` with wraparound.
 *
 * @param list Items: a plain array or a getter over reactive state.
 * @param options `initialValue`, `fallbackIndex`, and `getIndexOf` overrides.
 * @example
 * ```ts
 * const theme = useCycleList(['light', 'dark', 'system']);
 * theme.next(); // 'dark' (wraps around)
 * ```
 */
export function useCycleList<T>(
	list: MaybeGetter<T[]>,
	options: UseCycleListOptions<T> = {}
): UseCycleListReturn<T> {
	const { fallbackIndex = 0, getIndexOf } = options;

	const readList = (): T[] => resolveGetter(list);
	const findIndex = (value: T, target: T[]): number =>
		getIndexOf ? getIndexOf(value, target) : target.indexOf(value);

	const initial =
		options.initialValue === undefined ? readList()[0] : resolveGetter(options.initialValue);
	let state = $state<T>(initial as T);

	const index = $derived.by(() => {
		const target = readList();
		if (target.length === 0) return -1;
		const found = findIndex(state, target);
		return found < 0 ? fallbackIndex : found;
	});

	function set(i: number): T {
		const target = readList();
		if (target.length === 0) return state;
		const wrapped = ((i % target.length) + target.length) % target.length;
		state = target[wrapped] as T;
		return state;
	}

	let lastList: T[] = readList();
	$effect(() => {
		const target = readList();
		untrack(() => {
			// Re-anchor when the list identity changes; a no-op otherwise.
			if (target !== lastList) {
				lastList = target;
				set(index);
			}
		});
	});

	return {
		get value() {
			return state;
		},
		set value(next: T) {
			state = next;
		},
		get index() {
			return index;
		},
		next(n = 1) {
			return set(index + n);
		},
		prev(n = 1) {
			return set(index - n);
		},
		go(i: number) {
			return set(i);
		}
	};
}
