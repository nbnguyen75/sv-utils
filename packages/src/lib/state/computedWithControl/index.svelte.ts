import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Read-only controlled derivation returned by {@link computedWithControl}. */
export interface ComputedWithControlReturn<T> {
	/** Memoized value; recomputes on source changes or `trigger()`. Getter-backed. */
	readonly value: T;
	/** Force recomputation on next read. */
	trigger(): void;
}

/** Writable controlled derivation. */
export interface WritableComputedWithControlReturn<T> extends ComputedWithControlReturn<T> {
	/** Write through the provided setter. Getter/setter-backed. */
	value: T;
}

/**
 * Derived value with explicit dependencies and a manual refresh trigger.
 * @example
 * ```ts
 * const total = computedWithControl(() => items, () => sum(items));
 * total.trigger(); // force refresh
 * ```
 */

export function computedWithControl<T>(
	source: MaybeGetter<unknown>,
	fn: () => T
): ComputedWithControlReturn<T>;
export function computedWithControl<T>(
	source: MaybeGetter<unknown>,
	fn: { set(value: T): void; get(): T }
): WritableComputedWithControlReturn<T>;
export function computedWithControl<T>(
	source: MaybeGetter<unknown>,
	fn: (() => T) | { set(value: T): void; get(): T }
): ComputedWithControlReturn<T> {
	const read = typeof fn === 'function' ? fn : fn.get;
	const write = typeof fn === 'function' ? undefined : fn.set;

	let epoch = $state(0);
	let cachedEpoch = -1;
	let cached: T | undefined;

	$effect(() => {
		resolveGetter(source);
		untrack(() => {
			epoch += 1;
		});
	});

	function current(): T {
		// Track the epoch so live readers re-run on source changes/trigger.
		const revision = epoch;
		if (revision !== cachedEpoch) {
			cached = untrack(() => read()) as T;
			cachedEpoch = revision;
		}
		return cached as T;
	}

	function trigger() {
		epoch += 1;
	}

	if (write) {
		return {
			get value() {
				return current();
			},
			set value(next: T) {
				write(next);
			},
			trigger
		};
	}

	return {
		get value() {
			return current();
		},
		trigger
	};
}
