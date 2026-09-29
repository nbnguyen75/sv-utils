import type { MaybeGetter } from '../../shared/getter/index.ts';
import type { UseScrollOptions, UseScrollReturn, ScrollTarget } from '../useScroll/index.svelte.ts';

import { tick } from 'svelte';

import { useElementVisibility } from '../../elements/useElementVisibility/index.svelte.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { useScroll } from '../useScroll/index.svelte.ts';

/** Load direction. */
export type InfiniteScrollDirection = 'top' | 'bottom' | 'left' | 'right';

/** Options for {@link useInfiniteScroll}. */
export interface UseInfiniteScrollOptions extends UseScrollOptions {
	/**
	 * Gate loading per element.
	 * @default () => true
	 */
	canLoadMore?: (element: HTMLElement | SVGElement) => boolean;
	/**
	 * Edge to observe.
	 * @default 'bottom'
	 */
	direction?: InfiniteScrollDirection;
	/**
	 * Minimum distance (px) from the edge that still triggers loading.
	 * @default 0
	 */
	distance?: number;
	/**
	 * Quiet period (ms) after each load before the next may start.
	 * @default 100
	 */
	interval?: number;
}

/** State returned by {@link useInfiniteScroll}. */
export interface UseInfiniteScrollReturn {
	/** Whether a load is in flight. Getter-backed. */
	readonly isLoading: boolean;
	/** Re-check conditions now. */
	reset(): void;
}

/**
 * Load more content at the scroll edge.
 *
 * @param element Scroll container (element, window, document) or getter.
 * @param onLoadMore Loader receiving the scroll state; may be async.
 * @param options Direction, distance, interval, gates, and scroll options.
 * @example
 * ```ts
 * const { isLoading } = useInfiniteScroll(() => list, async () => {
 * 	await appendPage();
 * });
 * ```
 */
export function useInfiniteScroll(
	element: MaybeGetter<ScrollTarget>,
	onLoadMore: (state: UseScrollReturn) => void | Promise<void>,
	options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
	const { direction = 'bottom', interval = 100, canLoadMore = () => true } = options;

	const scroll = useScroll(element, {
		...options,
		offset: {
			[direction]: options.distance ?? 0,
			...options.offset
		}
	});

	let isLoading = $state(false);
	let pending: Promise<unknown> | null = null;

	function resolvedTarget(): ScrollTarget {
		return isBrowser ? (resolveGetter(element) ?? null) : null;
	}

	function observedElement(): HTMLElement | SVGElement | null {
		const target = resolvedTarget();
		if (!target) return null;
		// Window/Document targets scroll the page, which lives on <html>.
		if (target === window || target === document) return document.documentElement;
		return target as HTMLElement | SVGElement;
	}

	const visible = useElementVisibility(() => observedElement());

	function isSeen(): boolean {
		const target = resolvedTarget();
		// A viewport target is visible by definition; requiring an async
		// intersection callback would just defer the first page load.
		if (!target || target === window || target === document) return true;
		return visible.value;
	}

	function checkAndLoad(arrived: boolean) {
		scroll.measure();
		const target = observedElement();
		if (!target || !isSeen() || !canLoadMore(target) || pending) return;

		const horizontal = direction === 'left' || direction === 'right';
		const scrollSize = horizontal ? target.scrollWidth : target.scrollHeight;
		const clientSize = horizontal ? target.clientWidth : target.clientHeight;
		if (!arrived && scrollSize > clientSize) return;

		isLoading = true;
		pending = Promise.all([
			onLoadMore(scroll),
			new Promise((resolve) => setTimeout(resolve, interval))
		]).finally(() => {
			pending = null;
			isLoading = false;
			void tick().then(() => {
				checkAndLoad(scroll.arrivedState[direction]);
			});
		});
	}

	if (isBrowser) {
		$effect(() => {
			// Re-check when arrival or loadability change; isSeen() subscribes
			// to intersection state for element targets.
			checkAndLoad(scroll.arrivedState[direction]);
		});
	}

	return {
		get isLoading() {
			return isLoading;
		},
		reset() {
			void tick().then(() => {
				checkAndLoad(scroll.arrivedState[direction]);
			});
		}
	};
}
