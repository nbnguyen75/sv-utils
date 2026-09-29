import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';
import { useMutationObserver } from '../useMutationObserver/index.svelte.ts';
import { useResizeObserver } from '../useResizeObserver/index.svelte.ts';

/** Options for {@link useElementBounding}. */
export interface UseElementBoundingOptions {
	/**
	 * Reset all values to zero on unmount.
	 * @default true
	 */
	reset?: boolean;
	/**
	 * Re-measure on window resize.
	 * @default true
	 */
	windowResize?: boolean;
	/**
	 * Re-measure on window scroll (captured).
	 * @default true
	 */
	windowScroll?: boolean;
	/**
	 * Measure on mount.
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * `'sync'` measures immediately; `'next-frame'` defers a tick (useful
	 * when layout settles after the current frame).
	 * @default 'sync'
	 */
	updateTiming?: 'sync' | 'next-frame';
}

/** Bounding-box state returned by {@link useElementBounding}. */
export interface UseElementBoundingReturn {
	readonly height: number;
	readonly bottom: number;
	readonly left: number;
	readonly right: number;
	readonly top: number;
	readonly width: number;
	readonly x: number;
	readonly y: number;
	/** Re-measure now ( honors `updateTiming`). */
	update(): void;
}

/**
 * Track an element's bounding box.
 *
 * @param target Element or getter (e.g. `bind:this` state).
 * @param options Reset, listeners, immediacy, and timing flags.
 * @example
 * ```ts
 * const box = useElementBounding(() => card);
 * box.top; // viewport-relative top
 * box.update(); // re-measure now
 * ```
 */
export function useElementBounding(
	target: MaybeElement,
	options: UseElementBoundingOptions = {}
): UseElementBoundingReturn {
	const {
		reset = true,
		windowResize = true,
		windowScroll = true,
		immediate = true,
		updateTiming = 'sync'
	} = options;

	let height = $state(0);
	let bottom = $state(0);
	let left = $state(0);
	let right = $state(0);
	let top = $state(0);
	let width = $state(0);
	let x = $state(0);
	let y = $state(0);

	function recalculate() {
		const element = resolveGetter(target);
		if (!element) {
			if (reset) {
				height = 0;
				bottom = 0;
				left = 0;
				right = 0;
				top = 0;
				width = 0;
				x = 0;
				y = 0;
			}
			return;
		}
		const rect = element.getBoundingClientRect();
		height = rect.height;
		bottom = rect.bottom;
		left = rect.left;
		right = rect.right;
		top = rect.top;
		width = rect.width;
		x = rect.x;
		y = rect.y;
	}

	function update() {
		if (!isBrowser) return;
		if (updateTiming === 'sync') recalculate();
		else if (typeof requestAnimationFrame === 'function') {
			requestAnimationFrame(() => recalculate());
		} else recalculate();
	}

	useResizeObserver(target, () => update());
	useMutationObserver(target, () => update(), { attributeFilter: ['style', 'class'] });

	if (isBrowser) {
		if (windowScroll) {
			useEventListener(
				() => window,
				'scroll',
				() => update(),
				{ capture: true, passive: true }
			);
		}
		if (windowResize) {
			useEventListener(
				() => window,
				'resize',
				() => update(),
				{ passive: true }
			);
		}

		$effect(() => {
			// Measure on mount and whenever the target swaps.
			resolveGetter(target);
			untrack(() => {
				if (immediate) update();
			});
			return () => {
				if (reset) {
					height = 0;
					bottom = 0;
					left = 0;
					right = 0;
					top = 0;
					width = 0;
					x = 0;
					y = 0;
				}
			};
		});
	}

	return {
		get height() {
			return height;
		},
		get bottom() {
			return bottom;
		},
		get left() {
			return left;
		},
		get right() {
			return right;
		},
		get top() {
			return top;
		},
		get width() {
			return width;
		},
		get x() {
			return x;
		},
		get y() {
			return y;
		},
		update
	};
}
