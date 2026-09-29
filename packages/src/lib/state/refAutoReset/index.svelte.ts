import type { MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Auto-reset state returned by {@link refAutoReset}. */
export interface RefAutoResetReturn<T> {
	/** Current value; assigning re-arms the reset timer. Getter/setter-backed. */
	value: T;
}

/**
 * Create state that falls back to `defaultValue` after `afterMs` of quiet.
 *
 * @param defaultValue Fallback value; getters re-resolve on every reset.
 * @param afterMs Quiet period in milliseconds; getters resolve per write.
 * @example
 * ```ts
 * const status = refAutoReset('idle', 2000);
 * status.value = 'saved!'; // back to 'idle' after 2s quiet
 * ```
 */
export function refAutoReset<T>(
	defaultValue: MaybeGetter<T>,
	afterMs: MaybeGetter<number> = 10000
): RefAutoResetReturn<T> {
	let value = $state<T>(resolveGetter(defaultValue));
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		return () => {
			if (timer !== undefined) {
				clearTimeout(timer);
				timer = undefined;
			}
		};
	});

	return {
		get value() {
			return value;
		},
		set value(next: T) {
			value = next;
			if (timer !== undefined) clearTimeout(timer);
			timer = setTimeout(() => {
				value = resolveGetter(defaultValue);
				timer = undefined;
			}, resolveGetter(afterMs));
		}
	};
}
