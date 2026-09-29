import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options shared by every `until` matcher. */
export interface UntilOptions {
	/**
	 * Milliseconds after which the promise settles with the current value
	 * (or rejects with `throwOnTimeout`). `0`/omitted never times out.
	 * @default 0
	 */
	timeout?: number;
	/**
	 * Reject (instead of resolving the current value) on timeout.
	 * @default false
	 */
	throwOnTimeout?: boolean;
}

/** Matchers available on every `until` instance. */
export interface UntilBaseInstance<T> {
	/** Resolve with the first value satisfying `condition`. */
	toMatch(condition: (value: T) => boolean, options?: UntilOptions): Promise<T>;
	/** Resolve with the value after the next change. */
	changed(options?: UntilOptions): Promise<T>;
	/** Resolve with the value after `n` changes. */
	changedTimes(n?: number, options?: UntilOptions): Promise<T>;
}

/** Matchers for non-array sources. */
export interface UntilValueInstance<T> extends UntilBaseInstance<T> {
	/** Inverted matchers (resolve when the condition does NOT hold). */
	readonly not: UntilValueInstance<T>;
	/** Resolve when the source strictly equals `value` (getters tracked too). */
	toBe(value: MaybeGetter<T>, options?: UntilOptions): Promise<T>;
	/** Resolve with the first truthy value. */
	toBeTruthy(options?: UntilOptions): Promise<T>;
	/** Resolve with `null`. */
	toBeNull(options?: UntilOptions): Promise<null>;
	/** Resolve with `undefined`. */
	toBeUndefined(options?: UntilOptions): Promise<undefined>;
	/** Resolve with the first NaN value. */
	toBeNaN(options?: UntilOptions): Promise<T>;
}

/** Matchers for array sources. */
export interface UntilArrayInstance<T> extends UntilBaseInstance<T> {
	/** Inverted matchers. */
	readonly not: UntilArrayInstance<T>;
	/** Resolve with the array once it contains `value`. */
	toContains(value: MaybeGetter<unknown>, options?: UntilOptions): Promise<T>;
}

function timeoutError(timeout: number): Error {
	return new Error(`until() timed out after ${timeout}ms`);
}

function createValueUntil<T>(source: MaybeGetter<T>, isNot: boolean): UntilValueInstance<T> {
	function toMatch(
		condition: (value: T) => boolean,
		options: UntilOptions = {},
		extraReads: (() => void)[] = []
	): Promise<T> {
		const { timeout = 0, throwOnTimeout = false } = options;
		return new Promise<T>((resolvePromise, rejectPromise) => {
			let timer: ReturnType<typeof setTimeout> | undefined;
			let settled = false;
			let first = true;

			function done(settle: () => void) {
				if (settled) return;
				settled = true;
				if (timer !== undefined) {
					clearTimeout(timer);
					timer = undefined;
				}
				settle();
			}

			function check(snapshot: T) {
				if (condition(snapshot) !== isNot) done(() => resolvePromise(snapshot));
			}

			// Mount run subscribes but never evaluates: the synchronous check
			// below covers the already-matching case, so every condition —
			// including counting ones like changedTimes — evaluates exactly
			// once per genuine change.
			$effect(() => {
				for (const read of extraReads) read();
				const snapshot = resolveGetter(source);
				untrack(() => {
					if (first) {
						first = false;
						return;
					}
					if (!settled) check(snapshot);
				});
			});

			// Immediate check (VueUse `immediate: true`): resolve
			// synchronously when the condition already holds.
			check(resolveGetter(source));

			if (timeout > 0) {
				timer = setTimeout(() => {
					done(() => {
						if (throwOnTimeout) rejectPromise(timeoutError(timeout));
						else resolvePromise(resolveGetter(source));
					});
				}, timeout);
			}
		});
	}

	function toBe(value: MaybeGetter<T>, options: UntilOptions = {}): Promise<T> {
		return toMatch((snapshot) => snapshot === resolveGetter(value), options, [
			() => resolveGetter(value)
		]);
	}

	function changedTimes(n = 1, options: UntilOptions = {}): Promise<T> {
		let count = -1; // skip the immediate check
		return toMatch(() => {
			count += 1;
			return count >= n;
		}, options);
	}

	const instance: UntilValueInstance<T> = {
		toMatch: (condition, options) => toMatch(condition, options),
		changed: (options) => changedTimes(1, options),
		changedTimes: (n, options) => changedTimes(n, options),
		get not() {
			return createValueUntil(source, !isNot);
		},
		toBe: (value, options) => toBe(value, options),
		toBeTruthy: (options) => toMatch((snapshot) => Boolean(snapshot), options),
		toBeNull: (options) => toMatch((snapshot) => snapshot === null, options).then(() => null),
		toBeUndefined: (options) =>
			toMatch((snapshot) => snapshot === undefined, options).then(() => undefined),
		toBeNaN: (options) => toMatch((snapshot) => Number.isNaN(snapshot), options)
	};

	return instance;
}

function createArrayUntil<T>(source: MaybeGetter<T>, isNot: boolean): UntilArrayInstance<T> {
	const base = createValueUntil(source, isNot);

	function toContains(value: MaybeGetter<unknown>, options: UntilOptions = {}): Promise<T> {
		return base.toMatch((snapshot) => {
			const array = Array.from(snapshot as unknown as Iterable<unknown>);
			const target = resolveGetter(value);
			return array.includes(target) || array.includes(resolveGetter(value));
		}, options);
	}

	return {
		toMatch: (condition, options) => base.toMatch(condition, options),
		changed: (options) => base.changed(options),
		changedTimes: (n, options) => base.changedTimes(n, options),
		get not() {
			return createArrayUntil(source, !isNot);
		},
		toContains: (value, options) => toContains(value, options)
	};
}

/**
 * Promised one-time watches: resolve when a source meets a condition.
 * @example
 * ```ts
 * await until(() => status).toBe('ready');
 * startHeavyWork();
 * ```
 */

export function until<T extends unknown[]>(source: MaybeGetter<T>): UntilArrayInstance<T>;
/**
 * Promised one-time watches: resolve when a source meets a condition.
 * @example
 * ```ts
 * await until(() => status).toBe('ready');
 * startHeavyWork();
 * ```
 */

export function until<T>(source: MaybeGetter<T>): UntilValueInstance<T>;
export function until<T>(source: MaybeGetter<T>): UntilValueInstance<T> | UntilArrayInstance<T> {
	return Array.isArray(resolveGetter(source))
		? (createArrayUntil(source, false) as unknown as UntilValueInstance<T>)
		: createValueUntil(source, false);
}
