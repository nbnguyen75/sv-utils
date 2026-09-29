/**
 * `ResizeObserver` wrapper with multi-target support and disposal.
 *
 * Inspired by [VueUse `useResizeObserver`](https://vueuse.org/core/useResizeObserver/).
 * Re-observes when targets resolve differently (e.g. `bind:this` wiring
 * up late). Must be called in component initialization. Reports
 * `isSupported: false` (and never observes) without `ResizeObserver`
 * or during SSR. Disposal on unmount is automatic.
 */
import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { isElement } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';

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
