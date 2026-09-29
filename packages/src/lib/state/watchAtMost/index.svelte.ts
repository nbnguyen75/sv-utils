import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Options for {@link watchAtMost}. */
export interface WatchAtMostOptions {
	/** Maximum number of callback invocations before auto-stop. Getters resolve per fire. */
	count: MaybeGetter<number>;
	/**
	 * Fire on mount (counts as the first invocation).
	 * @default false
	 */
	immediate?: boolean;
}

/** Controls returned by {@link watchAtMost}. */
export interface WatchAtMostReturn {
	/** Invocations so far. Getter-backed (destructure-safe). */
	readonly calls: number;
	/** Resume notifications (no catch-up fire for missed changes). */
	resume(): void;
	/** Suspend notifications (changes while paused are dropped). */
	pause(): void;
	/** Stop watching permanently. */
	stop(): void;
}

/**
 * Watch `source` up to `count` invocations.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param cb Invoked per change with `(value, oldValue, onCleanup)`.
 * @param options `count` limit and `immediate` mount behavior.
 * @example
 * ```ts
 * watchAtMost(() => draft, (value) => save(value), { count: 5 });
 * // saves the first 5 edits, then stops
 * ```
 */
export function watchAtMost<T>(
	source: MaybeGetter<T>,
	cb: (value: T, oldValue: T | undefined, onCleanup: (cleanup: () => void) => void) => void,
	options: WatchAtMostOptions
): WatchAtMostReturn {
	const { immediate = false } = options;

	let calls = $state(0);
	let active = $state(true);
	let stopped = false;
	let first = true;
	let lastSeen: T = resolveGetter(source);
	let cleanup: (() => void) | undefined;

	function onCleanup(fn: () => void) {
		cleanup = fn;
	}

	function stop() {
		stopped = true;
	}

	function pause() {
		active = false;
	}

	function resume() {
		active = true;
	}

	$effect(() => {
		const value = resolveGetter(source);
		const isActive = active;
		untrack(() => {
			if (stopped) return;
			const isFirstRun = first;
			first = false;
			if (!isActive) {
				lastSeen = value;
				return;
			}
			if (isFirstRun && !immediate) {
				lastSeen = value;
				return;
			}
			if (!isFirstRun && Object.is(value, lastSeen)) return;
			const oldValue = isFirstRun ? undefined : lastSeen;
			lastSeen = value;
			cleanup?.();
			cleanup = undefined;
			calls += 1;
			if (calls >= resolveGetter(options.count)) stopped = true;
			cb(value, oldValue, onCleanup);
		});
	});

	return {
		stop,
		pause,
		resume,
		get calls() {
			return calls;
		}
	};
}
