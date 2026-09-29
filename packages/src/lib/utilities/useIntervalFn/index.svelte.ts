/**
 * `setInterval` wrapper with pause/resume controls and a reactive interval.
 *
 * Inspired by [VueUse `useIntervalFn`](https://vueuse.org/shared/useIntervalFn/).
 * Auto-starts on mount when `immediate`, restarts when a reactive interval
 * changes while active, and always disposes on unmount — so this must be
 * called in component initialization. Safe during SSR (no timer runs on
 * the server).
 */

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options for {@link useIntervalFn}. */
export interface UseIntervalFnOptions {
	/**
	 * Start the interval on mount.
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Invoke the callback synchronously when `resume` is called, in addition
	 * to the scheduled invocations.
	 * @default false
	 */
	immediateCallback?: boolean;
}

/** Controls returned by {@link useIntervalFn}. */
export interface UseIntervalFnReturn {
	/** Whether the interval is currently running. Getter-backed (destructure-safe). */
	readonly isActive: boolean;
	/** Stop the interval. Safe to call when idle. */
	pause(): void;
	/** (Re)start the interval. Non-positive intervals are ignored. */
	resume(): void;
}

/**
 * Repeating timer with controls.
 *
 * @param cb Callback invoked every interval.
 * @param interval Period in milliseconds; getters are tracked — changing
 *   the value while active restarts the timer at the new cadence.
 * @param options `immediate` auto-start and `immediateCallback` flags.
 */
export function useIntervalFn(
	cb: () => void,
	interval: MaybeGetter<number> = 1000,
	options: UseIntervalFnOptions = {}
): UseIntervalFnReturn {
	const { immediate = true, immediateCallback = false } = options;

	let isActive = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;

	function clear() {
		if (timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}
	}

	function pause() {
		isActive = false;
		clear();
	}

	function resume() {
		const period = resolveGetter(interval);
		if (period <= 0) return;
		isActive = true;
		if (immediateCallback) cb();
		clear();
		if (isActive) timer = setInterval(() => cb(), period);
	}

	$effect(() => {
		untrack(() => {
			if (immediate) resume();
		});
		return () => pause();
	});

	// Separate watcher so disposal (the cleanup above) can never be mistaken
	// for a stop request: a restart decision only reads `isActive`, and this
	// effect carries no cleanup of its own. Skips automatically while paused
	// because `resume` is gated on `isActive` being true.
	$effect(() => {
		resolveGetter(interval);
		untrack(() => {
			if (isActive) resume();
		});
	});

	return {
		get isActive() {
			return isActive;
		},
		pause,
		resume
	};
}
