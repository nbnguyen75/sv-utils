import type { MaybeGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { isElement } from '../../shared/is.ts';

/** Options for {@link useIntersectionObserver}. */
export interface UseIntersectionObserverOptions {
	/**
	 * Root element/document, or a getter for one.
	 */
	root?: MaybeGetter<Element | Document | null | undefined>;
	/**
	 * Root margin string; getters resolve per rebuild.
	 */
	rootMargin?: MaybeGetter<string | undefined>;
	/**
	 * Intersection ratio(s) triggering the callback.
	 * @default 0
	 */
	threshold?: number | number[];
	/**
	 * Start observing on mount.
	 * @default true
	 */
	immediate?: boolean;
}

/** State returned by {@link useIntersectionObserver}. */
export interface UseIntersectionObserverReturn {
	/** Whether `IntersectionObserver` exists in this environment. */
	readonly isSupported: boolean;
	/** Whether observation is currently active. Getter-backed. */
	readonly isActive: boolean;
	/** Resume observation. */
	resume(): void;
	/** Suspend observation (disconnects). */
	pause(): void;
	/** Stop permanently. */
	stop(): void;
}

/**
 * Observe element visibility intersections.
 *
 * @param target Element(s) or getters; nullish entries are skipped.
 * @param callback Observer callback.
 * @param options Root, margin, threshold, and auto-start.
 * @example
 * ```ts
 * const { pause, resume } = useIntersectionObserver(() => sentinel, ([entry]) => {
 * 	if (entry?.isIntersecting) loadMore();
 * });
 * ```
 */
export function useIntersectionObserver(
	target: MaybeElement | MaybeElement[],
	callback: IntersectionObserverCallback,
	options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
	const { immediate = true, threshold = 0 } = options;
	const isSupported = isBrowser && typeof IntersectionObserver === 'function';

	let isActive = $state(immediate);
	let stopped = false;
	let observer: IntersectionObserver | undefined;

	function disconnect() {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
	}

	function pause() {
		isActive = false;
		disconnect();
	}

	function resume() {
		if (!stopped) isActive = true;
	}

	function stop() {
		stopped = true;
		pause();
	}

	if (isSupported) {
		$effect(() => {
			const raw = Array.isArray(target) ? target : [target];
			const elements = raw.map((item) => resolveGetter(item));
			const root = options.root === undefined ? null : resolveGetter(options.root);
			const margin =
				options.rootMargin === undefined ? undefined : resolveGetter(options.rootMargin);
			const running = isActive;
			untrack(() => {
				disconnect();
				if (stopped || !running) return;
				const candidates = elements.filter((element) => isElement(element));
				if (candidates.length === 0) return;
				const init: IntersectionObserverInit = { root: root ?? null, threshold };
				if (margin !== undefined) init.rootMargin = margin;
				observer = new IntersectionObserver(callback, init);
				for (const element of candidates) observer.observe(element);
			});
			return () => disconnect();
		});
	}

	return {
		isSupported,
		get isActive() {
			return isActive;
		},
		pause,
		resume,
		stop
	};
}
