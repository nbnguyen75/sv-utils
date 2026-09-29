/**
 * Watch an array with per-change additions and removals.
 *
 * Inspired by [VueUse `watchArray`](https://vueuse.org/shared/watchArray/).
 * The source is sampled inside `$effect`, so this must be called in
 * component initialization. Stopping is flag-based (effects cannot
 * unsubscribe early); disposal on unmount is automatic.
 */
import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Callback for {@link watchArray}. */
export type WatchArrayCallback<T> = (
	value: T[],
	oldValue: T[],
	added: T[],
	removed: T[],
	onCleanup: (cleanup: () => void) => void
) => void;

/** Options for {@link watchArray}. */
export interface WatchArrayOptions {
	/**
	 * Fire on mount with `oldValue`/`removed` empty and `added` holding
	 * every item.
	 * @default false
	 */
	immediate?: boolean;
}

/**
 * Watch `source`, reporting identity-diffed additions and removals.
 * Duplicate-safe: each old item matches at most one new item.
 *
 * @param source Array, or a getter over reactive state.
 * @param cb Invoked per change with `(value, oldValue, added, removed, onCleanup)`.
 * @param options `immediate` mount behavior.
 * @returns `stop`: ignore further changes and run pending cleanup.
 */
export function watchArray<T>(
	source: MaybeGetter<T[]>,
	cb: WatchArrayCallback<T>,
	options: WatchArrayOptions = {}
): () => void {
	const { immediate = false } = options;

	let oldList: T[] = immediate ? [] : [...resolveGetter(source)];
	let stopped = false;
	let first = true;
	let cleanup: (() => void) | undefined;

	function onCleanup(fn: () => void) {
		cleanup = fn;
	}

	function stop() {
		stopped = true;
		cleanup?.();
		cleanup = undefined;
	}

	$effect(() => {
		const newList = resolveGetter(source);
		untrack(() => {
			if (stopped) return;
			if (first) {
				first = false;
				if (!immediate) {
					oldList = [...newList];
					return;
				}
			}
			cleanup?.();
			cleanup = undefined;
			const remains = new Array<boolean>(oldList.length).fill(false);
			const added: T[] = [];
			for (const item of newList) {
				let found = false;
				for (let i = 0; i < oldList.length; i += 1) {
					if (!remains[i] && item === oldList[i]) {
						remains[i] = true;
						found = true;
						break;
					}
				}
				if (!found) added.push(item);
			}
			const removed = oldList.filter((_, index) => !remains[index]);
			cb(newList, oldList, added, removed, onCleanup);
			oldList = [...newList];
		});
	});

	return stop;
}
