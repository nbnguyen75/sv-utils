/**
 * Counter with clamped increment / decrement / set / reset helpers.
 *
 * Inspired by [VueUse `useCounter`](https://vueuse.org/shared/useCounter/).
 * Pure `$state` logic — safe to call anywhere, including during SSR
 * (no DOM access, no effects).
 */

/** Options for {@link useCounter}. */
export interface UseCounterOptions {
	/** Lower bound applied to `inc` / `dec` / `set`. @default -Infinity */
	min?: number;
	/** Upper bound applied to `inc` / `dec` / `set`. @default Infinity */
	max?: number;
}

/** Counter state returned by {@link useCounter}. */
export interface UseCounterReturn {
	/**
	 * Reset to `value`, or to the initial value when omitted. Passing a
	 * value also redefines what a later bare `reset()` restores.
	 */
	reset(value?: number): void;
	/** Add `delta` (clamped). @default delta 1 */
	inc(delta?: number): void;
	/** Subtract `delta` (clamped). @default delta 1 */
	dec(delta?: number): void;
	/** Set the count (clamped). */
	set(value: number): void;
	/** Current count. Getter-backed (destructure-safe); write via `set`. */
	readonly count: number;
	/** Read the current count. */
	get(): number;
}

/**
 * Basic counter with utility functions.
 *
 * @param initialValue Starting value (not clamped, mirroring VueUse).
 * @param options `min` / `max` clamp bounds.
 */
export function useCounter(
	initialValue?: number | (() => number),
	options: UseCounterOptions = {}
): UseCounterReturn {
	const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options;

	let initial =
		initialValue === undefined
			? 0
			: typeof initialValue === 'function'
				? initialValue()
				: initialValue;
	let count = $state(initial);

	const limit = (n: number): number => Math.min(max, Math.max(min, n));

	return {
		get count() {
			return count;
		},
		inc(delta = 1) {
			count = limit(count + delta);
		},
		dec(delta = 1) {
			count = limit(count - delta);
		},
		get() {
			return count;
		},
		set(value: number) {
			count = limit(value);
		},
		reset(value?: number) {
			initial = value ?? initial;
			count = limit(initial);
		}
	};
}
