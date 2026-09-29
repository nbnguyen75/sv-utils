import type { MaybeElement } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { isElement } from '../../shared/is.ts';

/** Options for {@link useMutationObserver} (observer init). */
export type UseMutationObserverOptions = MutationObserverInit;

/** State returned by {@link useMutationObserver}. */
export interface UseMutationObserverReturn {
	/** Drain pending records without disconnecting. */
	takeRecords(): MutationRecord[] | undefined;
	/** Whether `MutationObserver` exists in this environment. */
	readonly isSupported: boolean;
	/** Disconnect permanently. Safe to call twice. */
	stop(): void;
}

/**
 * Observe DOM mutations.
 *
 * @param target Element(s) or getters; nullish entries are skipped.
 * @param callback Observer callback.
 * @param options `MutationObserverInit` (e.g. `{ attributes: true }`).
 * @example
 * ```ts
 * const { takeRecords } = useMutationObserver(() => article, callback, {
 * 	childList: true
 * });
 * takeRecords(); // drain pending without disconnecting
 * ```
 */
export function useMutationObserver(
	target: MaybeElement | MaybeElement[],
	callback: MutationCallback,
	options: UseMutationObserverOptions = {}
): UseMutationObserverReturn {
	const isSupported = isBrowser && typeof MutationObserver === 'function';

	let observer: MutationObserver | undefined;
	let stopped = false;

	function disconnect() {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
	}

	function stop() {
		stopped = true;
		disconnect();
	}

	function takeRecords(): MutationRecord[] | undefined {
		return observer?.takeRecords();
	}

	if (isSupported) {
		$effect(() => {
			const raw = Array.isArray(target) ? target : [target];
			const elements = raw.map((item) => resolveGetter(item));
			untrack(() => {
				if (stopped) return;
				disconnect();
				observer = new MutationObserver(callback);
				for (const element of elements) {
					if (isElement(element)) observer.observe(element, options);
				}
			});
			return () => disconnect();
		});
	}

	return { isSupported, stop, takeRecords };
}
