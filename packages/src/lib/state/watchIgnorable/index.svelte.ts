import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Run `updater` without notifying this watcher. */
export type IgnoredUpdater = (updater: () => void) => void;

/** Options for {@link watchIgnorable}. */
export interface WatchIgnorableOptions {
	/**
	 * Fire on mount with `oldValue` undefined.
	 * @default false
	 */
	immediate?: boolean;
}

/** Controls returned by {@link watchIgnorable}. */
export interface WatchIgnorableReturn {
	/** Drop the currently pending change, if any. */
	ignorePrevAsyncUpdates(): void;
	/** Apply `updater` without firing the callback. */
	ignoreUpdates: IgnoredUpdater;
	/** Stop watching permanently (runs pending cleanup). */
	stop(): void;
}

/**
 * Watch `source`, with silence controls for programmatic writes.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param cb Invoked per observed change with `(value, oldValue, onCleanup)`.
 * @param options `immediate` mount behavior.
 * @example
 * ```ts
 * const { ignoreUpdates } = watchIgnorable(() => doc, persist);
 * ignoreUpdates(() => undo()); // silent revert
 * ```
 */
export function watchIgnorable<T>(
	source: MaybeGetter<T>,
	cb: (value: T, oldValue: T | undefined, onCleanup: (cleanup: () => void) => void) => void,
	options: WatchIgnorableOptions = {}
): WatchIgnorableReturn {
	const { immediate = false } = options;

	let stopped = false;
	let first = true;
	let ignoreNext = false;
	let lastSeen: T | undefined;
	let cleanup: (() => void) | undefined;

	function onCleanup(fn: () => void) {
		cleanup = fn;
	}

	function stop() {
		stopped = true;
		cleanup?.();
		cleanup = undefined;
	}

	function ignoreUpdates(updater: () => void) {
		ignoreNext = true;
		updater();
	}

	function ignorePrevAsyncUpdates() {
		ignoreNext = true;
	}

	$effect(() => {
		const value = resolveGetter(source);
		untrack(() => {
			if (stopped) return;
			if (first) {
				first = false;
				lastSeen = value;
				if (!immediate) {
					ignoreNext = false;
					return;
				}
				cleanup?.();
				cleanup = undefined;
				cb(value, undefined, onCleanup);
				return;
			}
			if (ignoreNext) {
				ignoreNext = false;
				lastSeen = value;
				return;
			}
			if (Object.is(value, lastSeen)) return;
			const oldValue = lastSeen;
			lastSeen = value;
			cleanup?.();
			cleanup = undefined;
			cb(value, oldValue, onCleanup);
		});
	});

	return { ignoreUpdates, ignorePrevAsyncUpdates, stop };
}
