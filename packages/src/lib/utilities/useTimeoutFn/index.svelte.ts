/**
 * `setTimeout` wrapper with start/stop controls and pending state.
 *
 * Inspired by [VueUse `useTimeoutFn`](https://vueuse.org/shared/useTimeoutFn/).
 * Auto-starts on mount when `immediate` (browser only) and always disposes
 * on unmount, so this must be called in component initialization. Pure
 * timer logic otherwise — safe during SSR (no timer runs on the server).
 */

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options for {@link useTimeoutFn}. */
export interface UseTimeoutFnOptions {
	/**
	 * Start the timer on mount.
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Invoke the callback synchronously when `start` is called, in addition
	 * to the delayed invocation.
	 * @default false
	 */
	immediateCallback?: boolean;
}

/** Controls returned by {@link useTimeoutFn}. */
export interface UseTimeoutFnReturn<Args extends unknown[]> {
	/** Whether a timeout is currently armed. Getter-backed (destructure-safe). */
	readonly isPending: boolean;
	/** Arm (or re-arm) the timeout. A running timer is cleared first. */
	start(...args: Args): void;
	/** Disarm the timer. Safe to call when idle. */
	stop(): void;
}

/**
 * One-shot timer with controls.
 *
 * @param cb Callback invoked once per arming (without arguments).
 * @param interval Delay in milliseconds; getters resolve at each `start`.
 * @param options `immediate` auto-start and `immediateCallback` flags.
 */
export function useTimeoutFn<Args extends unknown[]>(
	cb: (...args: Args) => void,
	interval: MaybeGetter<number>,
	options: UseTimeoutFnOptions = {}
): UseTimeoutFnReturn<Args> {
	const { immediate = true, immediateCallback = false } = options;

	let isPending = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Immediate-edge invocations carry no arguments (VueUse parity): a
	// single empty-tuple constant keeps the generic Args signatures honest.
	const NO_ARGS = [] as unknown as Args;

	function clear() {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	}

	function stop() {
		isPending = false;
		clear();
	}

	function start(...args: Args) {
		if (immediateCallback) cb(...NO_ARGS);
		clear();
		isPending = true;
		timer = setTimeout(() => {
			isPending = false;
			timer = undefined;
			cb(...args);
		}, resolveGetter(interval));
	}

	$effect(() => {
		untrack(() => {
			if (immediate) start(...NO_ARGS);
		});
		return () => stop();
	});

	return {
		get isPending() {
			return isPending;
		},
		start,
		stop
	};
}
