import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Manual-reset state returned by {@link refManualReset}. */
export interface RefManualResetReturn<T> {
	/** Current value. Getter/setter-backed (destructure-safe). */
	value: T;
	/** Restore the default value (getters re-resolve). */
	reset(): void;
}

/**
 * Create state with an explicit `reset()`.
 *
 * @param defaultValue Fallback value; getters resolve at creation and per reset.
 * @example
 * ```ts
 * const query = refManualReset('');
 * query.value = 'hello';
 * query.reset(); // ''
 * ```
 */
export function refManualReset<T>(defaultValue: MaybeGetter<T>): RefManualResetReturn<T> {
	let value = $state<T>(resolveGetter(defaultValue));

	return {
		get value() {
			return value;
		},
		set value(next: T) {
			value = next;
		},
		reset() {
			value = resolveGetter(defaultValue);
		}
	};
}
