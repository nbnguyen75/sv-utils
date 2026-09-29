import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Per-frame arguments passed to a {@link useRafFn} callback. */
export interface UseRafFnCallbackArguments {
	/** Milliseconds elapsed since the previous executed frame. */
	delta: number;
	/** High-resolution timestamp of the current frame. */
	timestamp: DOMHighResTimeStamp;
}

/** Options for {@link useRafFn}. */
export interface UseRafFnOptions {
	/**
	 * Start the loop on mount.
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Maximum frames per second; frames above the budget are skipped.
	 * Getters resolve per frame. `null` disables the cap.
	 * @default null
	 */
	fpsLimit?: MaybeGetter<number | null>;
	/**
	 * Stop automatically after the first executed frame.
	 * @default false
	 */
	once?: boolean;
}

/** Controls returned by {@link useRafFn}. */
export interface UseRafFnReturn {
	/** Whether the loop is currently running. Getter-backed (destructure-safe). */
	readonly isActive: boolean;
	/** Stop the loop. Safe to call when idle. */
	pause(): void;
	/** Start (or restart) the loop. No-op without `requestAnimationFrame`. */
	resume(): void;
}

function hasRaf(): boolean {
	return typeof requestAnimationFrame === 'function';
}

/**
 * Run `fn` on every animation frame, with controls.
 *
 * @param fn Frame callback receiving `{ delta, timestamp }`.
 * @param options `immediate` auto-start, `fpsLimit` cap, and `once` mode.
 * @example
 * ```ts
 * useRafFn(({ delta }) => {
 * 	x += delta * 0.06;
 * });
 * ```
 */
export function useRafFn(
	fn: (args: UseRafFnCallbackArguments) => void,
	options: UseRafFnOptions = {}
): UseRafFnReturn {
	const { immediate = true, fpsLimit = null, once = false } = options;

	let isActive = $state(false);
	let previousFrameTimestamp = 0;
	let rafId: number | null = null;

	function loop(timestamp: DOMHighResTimeStamp) {
		if (!isActive) return;

		if (!previousFrameTimestamp) previousFrameTimestamp = timestamp;
		const delta = timestamp - previousFrameTimestamp;

		const limit = resolveGetter(fpsLimit);
		const budget = limit ? 1000 / limit : null;
		if (budget && delta < budget) {
			rafId = requestAnimationFrame(loop);
			return;
		}

		previousFrameTimestamp = timestamp;
		fn({ delta, timestamp });
		if (once) {
			isActive = false;
			rafId = null;
			return;
		}
		rafId = requestAnimationFrame(loop);
	}

	function resume() {
		if (isActive || !hasRaf()) return;
		isActive = true;
		previousFrameTimestamp = 0;
		rafId = requestAnimationFrame(loop);
	}

	function pause() {
		isActive = false;
		if (rafId !== null && hasRaf()) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	$effect(() => {
		untrack(() => {
			if (immediate) resume();
		});
		return () => pause();
	});

	return {
		get isActive() {
			return isActive;
		},
		pause,
		resume
	};
}
