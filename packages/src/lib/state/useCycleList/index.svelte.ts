/**
 * Cycle through a list of items with wraparound navigation.
 *
 * Inspired by [VueUse `useCycleList`](https://vueuse.org/core/useCycleList/).
 * List changes re-anchor the state via `$effect`, so this must be called in
 * component initialization.
 */
import { untrack } from 'svelte';

import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Options for {@link useCycleList}. */
export interface UseCycleListOptions<T> {
	/**
	 * Initial value. Defaults to the first list item.
	 */
	initialValue?: T | (() => T);
	/**
	 * Index used when the current value is not found in the list.
	 * @default 0
	 */
	fallbackIndex?: number;
	/**
	 * Custom index lookup.
	 * @default (value, list) => list.indexOf(value)
	 */
	getIndexOf?: (value: T, list: T[]) => number;
}

/** Cycling state returned by {@link useCycleList}. */
export interface UseCycleListReturn<T> {
	/** Current item. Getter/setter-backed (destructure-safe). */
	value: T;
	/** Index of the current item (falls back per options). Getter-backed. */
	readonly index: number;
	/** Move forward `n` places with wraparound. Returns the new item. */
	next(n?: number): T;
	/** Move backward `n` places with wraparound. Returns the new item. */
	prev(n?: number): T;
	/** Jump to index `i` (wraps out-of-range indices). Returns the new item. */
	go(i: number): T;
}

/**
 * Cycle through `list` with wraparound.
 *
 * @param list Items: a plain array or a getter over reactive state.
 * @param options `initialValue`, `fallbackIndex`, and `getIndexOf` overrides.
 */
export function useCycleList<T>(
	list: MaybeGetter<T[]>,
	options: UseCycleListOptions<T> = {}
): UseCycleListReturn<T> {
	const { fallbackIndex = 0, getIndexOf } = options;

	const readList = (): T[] => resolve(list);
	const findIndex = (value: T, target: T[]): number =>
		getIndexOf ? getIndexOf(value, target) : target.indexOf(value);

	const initial =
		options.initialValue === undefined ? readList()[0] : resolve(options.initialValue);
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
