import type { MaybeElement } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { isElement } from '../../shared/is.ts';

/** Options for {@link useResizeObserver} (observer init + targets). */
export type UseResizeObserverOptions = ResizeObserverOptions;

/** State returned by {@link useResizeObserver}. */
export interface UseResizeObserverReturn {
	/** Whether `ResizeObserver` exists in this environment. */
	readonly isSupported: boolean;
	/** Disconnect permanently. Safe to call twice. */
	stop(): void;
}

function resolveTargets(target: MaybeElement | MaybeElement[]): (Element | null | undefined)[] {
	const list = Array.isArray(target) ? target : [target];
	return list.map((item) => resolveGetter(item));
}

/**
 * Observe element size changes.
 *
 * @param target Element(s) or getters; nullish entries are skipped.
 * @param callback Observer callback.
 * @param options `ResizeObserver` init options (e.g. `box`).
 * @example
 * ```ts
 * const { stop } = useResizeObserver(() => panel, ([entry]) => {
 * 	console.log(entry?.contentRect.width);
 * });
 * stop(); // disconnect permanently
 * ```
 */
export function useResizeObserver(
	target: MaybeElement | MaybeElement[],
	callback: ResizeObserverCallback,
	options: UseResizeObserverOptions = {}
): UseResizeObserverReturn {
	const isSupported = isBrowser && typeof ResizeObserver === 'function';

	let observer: ResizeObserver | undefined;
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

	if (isSupported) {
		$effect(() => {
			const elements = resolveTargets(target);
			untrack(() => {
				if (stopped) return;
				disconnect();
				observer = new ResizeObserver(callback);
				for (const element of elements) {
					if (isElement(element)) observer.observe(element, options);
				}
			});
			return () => disconnect();
		});
	}

	return { isSupported, stop };
}
