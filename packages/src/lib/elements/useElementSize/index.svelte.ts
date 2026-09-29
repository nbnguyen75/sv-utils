import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useResizeObserver } from '../useResizeObserver/index.svelte.ts';

/** Size box model. */
export type ElementSizeBox = 'content-box' | 'border-box' | 'device-pixel-content-box';

/** Initial dimensions. */
export interface ElementSize {
	width: number;
	height: number;
}

/** Options for {@link useElementSize}. */
export interface UseElementSizeOptions {
	/**
	 * Which box to measure.
	 * @default 'content-box'
	 */
	box?: ElementSizeBox;
}

/** Size state returned by {@link useElementSize}. */
export interface UseElementSizeReturn {
	/** Content width. Getter-backed (destructure-safe). */
	readonly width: number;
	/** Content height. Getter-backed (destructure-safe). */
	readonly height: number;
	/** Disconnect the observer permanently. */
	stop(): void;
}

function sumBox(
	sizes: readonly { inlineSize: number; blockSize: number }[] | undefined
): number | undefined {
	if (!sizes || sizes.length === 0) return undefined;
	let total = 0;
	for (const size of sizes) total += size.inlineSize;
	return total;
}

function sumBoxBlock(
	sizes: readonly { inlineSize: number; blockSize: number }[] | undefined
): number | undefined {
	if (!sizes || sizes.length === 0) return undefined;
	let total = 0;
	for (const size of sizes) total += size.blockSize;
	return total;
}

/**
 * Track an element's dimensions.
 *
 * @param target Element or getter (e.g. `bind:this` state).
 * @param initialSize Server and pre-mount dimensions.
 * @param options `box` model to measure.
 * @example
 * ```ts
 * const { width, height } = useElementSize(() => panel);
 * width; // content-box width
 * ```
 */
export function useElementSize(
	target: MaybeElement,
	initialSize: ElementSize = { width: 0, height: 0 },
	options: UseElementSizeOptions = {}
): UseElementSizeReturn {
	const { box = 'content-box' } = options;

	let width = $state(initialSize.width);
	let height = $state(initialSize.height);

	function applySize(nextWidth: number, nextHeight: number) {
		// jsdom-style environments report NaN (no layout): keep the
		// previous value instead of poisoning state.
		if (Number.isFinite(nextWidth)) width = nextWidth;
		if (Number.isFinite(nextHeight)) height = nextHeight;
	}

	const { stop: stopObserver } = useResizeObserver(
		target,
		(entries) => {
			const entry = entries[0];
			if (!entry) return;
			const element = entry.target as Element;
			if (element.namespaceURI?.includes('svg')) {
				const rect = element.getBoundingClientRect();
				applySize(rect.width, rect.height);
				return;
			}
			const sizes =
				box === 'border-box'
					? entry.borderBoxSize
					: box === 'content-box'
						? entry.contentBoxSize
						: entry.devicePixelContentBoxSize;
			const boxWidth = sumBox(sizes);
			const boxHeight = sumBoxBlock(sizes);
			if (boxWidth !== undefined && boxHeight !== undefined) {
				applySize(boxWidth, boxHeight);
				return;
			}
			applySize(entry.contentRect.width, entry.contentRect.height);
		},
		{ box }
	);

	function measure() {
		const element = resolveGetter(target);
		if (!element || !('offsetWidth' in element)) return;
		const host = element as HTMLElement;
		if (box !== 'content-box' || !isBrowser) {
			applySize(host.offsetWidth, host.offsetHeight);
			return;
		}
		const style = window.getComputedStyle(host);
		const padX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
		const padY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
		const borderX =
			Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth);
		const borderY =
			Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
		applySize(host.offsetWidth - padX - borderX, host.offsetHeight - padY - borderY);
	}

	$effect(() => {
		// Measure on mount and reset when the target swaps.
		const element = resolveGetter(target);
		untrack(() => {
			if (element) measure();
			else {
				width = initialSize.width;
				height = initialSize.height;
			}
		});
	});

	function stop() {
		stopObserver();
	}

	return {
		get width() {
			return width;
		},
		get height() {
			return height;
		},
		stop
	};
}
