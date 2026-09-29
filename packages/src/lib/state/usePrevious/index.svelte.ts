import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Previous-value state returned by {@link usePrevious}. */
export interface UsePreviousReturn<T> {
	/**
	 * Value of the source before its most recent change, or `initialValue`
	 * until the first change. Getter-backed (destructure-safe).
	 */
	readonly value: T | undefined;
}

/**
 * Holds the value of a reactive source before its most recent change.
 * @example
 * ```ts
 * const previous = usePrevious(() => name, '');
 * previous.value; // value before the latest change
 * ```
 */

export function usePrevious<T>(source: MaybeGetter<T>): UsePreviousReturn<T | undefined>;
/**
 * Holds the value of a reactive source before its most recent change.
 * @example
 * ```ts
 * const previous = usePrevious(() => name, '');
 * previous.value; // value before the latest change
 * ```
 */

export function usePrevious<T>(source: MaybeGetter<T>, initialValue: T): UsePreviousReturn<T>;
export function usePrevious<T>(source: MaybeGetter<T>, initialValue?: T): UsePreviousReturn<T> {
	let previous = $state<T | undefined>(initialValue);
	let last = $state<T>(resolveGetter(source));

	$effect(() => {
		const snapshot = resolveGetter(source);
		untrack(() => {
			// Skip until the source actually moves; this also preserves the
			// initial value through the effect's first run on mount.
			if (!Object.is(snapshot, last)) {
				previous = last;
				last = snapshot;
			}
		});
	});

	return {
		get value() {
			return previous;
		}
	};
}
