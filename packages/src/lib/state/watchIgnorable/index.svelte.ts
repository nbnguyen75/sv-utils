/**
 * Watch a source with the ability to apply silent updates.
 *
 * Inspired by [VueUse `watchIgnorable`](https://vueuse.org/shared/watchIgnorable/).
 * `ignoreUpdates` runs a mutation without notifying this watcher;
 * `ignorePrevAsyncUpdates` drops whatever change is currently pending.
 * The source is sampled inside `$effect`, so this must be called in
 * component initialization. Disposal on unmount is automatic.
 *
 * Svelte has no synchronous observation primitive, so ignorance is a
 * boolean guard (not VueUse's exact counters): an `ignoreUpdates` call
 * that mutates nothing leaves a stale guard swallowing the next change,
 * and external changes coalesced into an ignored flush are skipped
 * together. Undo/redo/revert flows — the documented use case — behave
 * exactly.
 */
import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

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
	/** Apply `updater` without firing the callback. */
	ignoreUpdates: IgnoredUpdater;
	/** Drop the currently pending change, if any. */
	ignorePrevAsyncUpdates(): void;
	/** Stop watching permanently (runs pending cleanup). */
	stop(): void;
}

/**
 * Watch `source`, with silence controls for programmatic writes.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param cb Invoked per observed change with `(value, oldValue, onCleanup)`.
 * @param options `immediate` mount behavior.
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
