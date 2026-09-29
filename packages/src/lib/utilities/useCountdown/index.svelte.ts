import { useIntervalFn } from '../useIntervalFn/index.svelte.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { resolveGetter } from '../../shared/getter/index.ts';

/** Scheduler factory for {@link useCountdown}: pause/resume/isActive controls. */
export interface UseCountdownScheduler {
	pause(): void;
	resume(): void;
	readonly isActive: boolean;
}

/** Options for {@link useCountdown}. */
export interface UseCountdownOptions {
	/**
	 * Tick source factory. Defaults to a 1-second `useIntervalFn`
	 * that starts paused.
	 */
	scheduler?: (cb: () => void) => UseCountdownScheduler;
	/** Called when the countdown reaches zero. */
	onComplete?: () => void;
	/** Called on every tick. */
	onTick?: () => void;
}

/** State returned by {@link useCountdown}. */
export interface UseCountdownReturn {
	/** Seconds remaining. Getter/setter-backed (destructure-safe). */
	remaining: number;
	/** Whether the countdown is currently ticking. Getter-backed. */
	readonly isActive: boolean;
	/** Reset to `countdown` (or the initial value) without starting. */
	reset(countdown?: MaybeGetter<number>): void;
	/** Pause and reset to the initial value. */
	stop(): void;
	/** Reset to `countdown` (or the initial value) and start. */
	start(countdown?: MaybeGetter<number>): void;
	/** Pause the countdown, keeping the remaining value. */
	pause(): void;
	/** Resume ticking (no-op when already active or finished). */
	resume(): void;
}

/**
 * Countdown in seconds.
 *
 * @param initialCountdown Starting value; getters re-resolve on `reset()`.
 * @param options `scheduler` factory plus `onTick` / `onComplete` callbacks.
 * @example
 * ```ts
 * const timer = useCountdown(10, { onComplete: () => finish() });
 * timer.start();
 * timer.remaining; // seconds left
 * ```
 */
export function useCountdown(
	initialCountdown: MaybeGetter<number>,
	options: UseCountdownOptions = {}
): UseCountdownReturn {
	const { scheduler = (cb: () => void) => useIntervalFn(cb, 1000, { immediate: false }) } = options;
	const { onComplete, onTick } = options;

	let remaining = $state(resolveGetter(initialCountdown));

	const controls = scheduler(() => {
		const value = remaining - 1;
		remaining = value < 0 ? 0 : value;
		onTick?.();
		if (remaining <= 0) {
			controls.pause();
			onComplete?.();
		}
	});

	function reset(countdown?: MaybeGetter<number>) {
		remaining =
			countdown === undefined ? resolveGetter(initialCountdown) : resolveGetter(countdown);
	}

	function resume() {
		if (!controls.isActive && remaining > 0) controls.resume();
	}

	return {
		get remaining() {
			return remaining;
		},
		set remaining(value: number) {
			remaining = value;
		},
		get isActive() {
			return controls.isActive;
		},
		reset,
		stop() {
			controls.pause();
			reset();
		},
		start(countdown?: MaybeGetter<number>) {
			reset(countdown);
			controls.resume();
		},
		pause() {
			controls.pause();
		},
		resume
	};
}
