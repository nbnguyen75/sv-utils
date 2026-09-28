/**
 * Holds the previous value of a reactive source.
 *
 * Inspired by [VueUse `usePrevious`](https://vueuse.org/core/usePrevious/).
 * The source is sampled inside `$effect` (Vue's `watch` equivalent), so
 * this must be called in component initialization. Bookkeeping reads are
 * `untrack`ed to avoid self-triggering the effect.
 */
import { untrack } from 'svelte';

import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Previous-value state returned by {@link usePrevious}. */
export interface UsePreviousReturn<T> {
	/**
	 * Value of the source before its most recent change, or `initialValue`
	 * until the first change. Getter-backed (destructure-safe).
	 */
	readonly value: T | undefined;
}

export function usePrevious<T>(source: MaybeGetter<T>): UsePreviousReturn<T | undefined>;
export function usePrevious<T>(source: MaybeGetter<T>, initialValue: T): UsePreviousReturn<T>;
export function usePrevious<T>(source: MaybeGetter<T>, initialValue?: T): UsePreviousReturn<T> {
	let previous = $state<T | undefined>(initialValue);
	let last = $state<T>(resolve(source));

	$effect(() => {
		const snapshot = resolve(source);
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
