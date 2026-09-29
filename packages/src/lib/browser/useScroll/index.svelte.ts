import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { useMutationObserver } from '../../elements/useMutationObserver/index.svelte.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { useDebounceFn } from '../../utilities/useDebounceFn/index.ts';
import { useThrottleFn } from '../../utilities/useThrottleFn/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Scrollable target: element, window, or document. */
export type ScrollTarget = HTMLElement | SVGElement | Window | Document | null | undefined;

/** Arrival flags per edge. */
export interface ScrollArrivedState {
	bottom: boolean;
	right: boolean;
	left: boolean;
	top: boolean;
}

/** Scroll direction flags (reset on scroll end). */
export interface ScrollDirections {
	bottom: boolean;
	right: boolean;
	left: boolean;
	top: boolean;
}

/** Options for {@link useScroll}. */
export interface UseScrollOptions {
	/**
	 * Edge arrival slack in pixels.
	 */
	offset?: { bottom?: number; right?: number; left?: number; top?: number };
	/** Listener options for the scroll event. */
	eventListenerOptions?: boolean | AddEventListenerOptions;
	/**
	 * Observe DOM mutations and re-measure (`true` shorthand supported).
	 * @default false
	 */
	observe?: boolean | { mutation?: boolean };
	/**
	 * Scroll behavior for programmatic `x`/`y` writes.
	 * @default 'auto'
	 */
	behavior?: MaybeGetter<ScrollBehavior>;
	/** Mount-measure failures report here. Defaults to `console.error`. */
	onError?: (error: unknown) => void;
	/** Called on every (possibly throttled) scroll event. */
	onScroll?: (event: Event) => void;
	/** Called when scrolling ends. */
	onStop?: (event: Event) => void;
	/**
	 * Throttle scroll handling in milliseconds (`0` disables).
	 * @default 0
	 */
	throttle?: number;
	/**
	 * Quiet period after the last event before scroll end fires
	 * (added to `throttle`).
	 * @default 200
	 */
	idle?: number;
}

/** State returned by {@link useScroll}. */
export interface UseScrollReturn {
	/** Edge arrival flags. Getter-backed. */
	readonly arrivedState: ScrollArrivedState;
	/** Current scroll directions. Getter-backed. */
	readonly directions: ScrollDirections;
	/** Whether a scroll is in flight. Getter-backed. */
	readonly isScrolling: boolean;
	/** Re-measure now. */
	measure(): void;
	/** Horizontal position; assigning scrolls. Getter/setter-backed. */
	x: number;
	/** Vertical position; assigning scrolls. Getter/setter-backed. */
	y: number;
}

/**
 * Sub-pixel rounding makes exact edge comparison unreliable, so arrival
 * uses a 1px tolerance (mirrors upstream).
 */
const ARRIVED_THRESHOLD_PIXELS = 1;

function isWindowTarget(target: ScrollTarget): target is Window {
	return (
		typeof target === 'object' &&
		target !== null &&
		typeof (target as Window).scrollY === 'number' &&
		typeof (target as Window).scrollTo === 'function'
	);
}

function isDocumentTarget(target: ScrollTarget): target is Document {
	return (
		typeof target === 'object' &&
		target !== null &&
		(target as Document).nodeType === 9 &&
		!!(target as Document).documentElement
	);
}

function scrollContainerOf(target: ScrollTarget): Element | null {
	if (!target) return null;
	if (isWindowTarget(target)) return target.document.documentElement;
	if (isDocumentTarget(target)) return target.documentElement;
	return target as Element;
}

/**
 * Reactive scroll tracking for an element, window, or document.
 *
 * @param target Scroll container or getter.
 * @param options Throttle, idle, offsets, observation, callbacks, behavior.
 * @example
 * ```ts
 * const scroll = useScroll(() => panel);
 * scroll.y; // element scrollTop
 * scroll.y = 0; // scrolls to top
 * ```
 */
export function useScroll(
	target: MaybeGetter<ScrollTarget>,
	options: UseScrollOptions = {}
): UseScrollReturn {
	const {
		throttle = 0,
		idle = 200,
		onStop = () => {},
		onScroll = () => {},
		offset = {},
		observe = false,
		eventListenerOptions = { capture: false, passive: true },
		behavior = 'auto',
		onError = (error: unknown) => console.error(error)
	} = options;

	const leftOffset = offset.left ?? 0;
	const rightOffset = offset.right ?? 0;
	const topOffset = offset.top ?? 0;
	const bottomOffset = offset.bottom ?? 0;

	let internalX = $state(0);
	let internalY = $state(0);
	let isScrolling = $state(false);
	const arrived = $state<ScrollArrivedState>({
		left: true,
		right: false,
		top: true,
		bottom: false
	});
	const directions = $state<ScrollDirections>({
		left: false,
		right: false,
		top: false,
		bottom: false
	});

	function scrollTo(left?: number, top?: number) {
		if (!isBrowser) return;
		const element = resolveGetter(target);
		if (!element) return;
		const nextLeft = left ?? internalX;
		const nextTop = top ?? internalY;
		const container = scrollContainerOf(element);
		if (isWindowTarget(element)) {
			element.scrollTo({ left: nextLeft, top: nextTop, behavior: resolveGetter(behavior) });
		} else if (isDocumentTarget(element)) {
			element.documentElement.scrollTo?.({
				left: nextLeft,
				top: nextTop,
				behavior: resolveGetter(behavior)
			});
		} else if (container) {
			(container as HTMLElement).scrollTo?.({
				left: nextLeft,
				top: nextTop,
				behavior: resolveGetter(behavior)
			});
		}
		if (container) {
			internalX = container.scrollLeft;
			internalY = container.scrollTop;
		}
	}

	function setArrived(container: Element | null) {
		if (!isBrowser || !container) return;
		const style = window.getComputedStyle(container);
		const multiplier = style.direction === 'rtl' ? -1 : 1;

		const scrollLeft = container.scrollLeft;
		directions.left = scrollLeft < internalX;
		directions.right = scrollLeft > internalX;

		const atLeft = Math.abs(scrollLeft * multiplier) <= leftOffset;
		const atRight =
			Math.abs(scrollLeft * multiplier) + container.clientWidth >=
			container.scrollWidth - rightOffset - ARRIVED_THRESHOLD_PIXELS;

		if (style.display === 'flex' && style.flexDirection === 'row-reverse') {
			arrived.left = atRight;
			arrived.right = atLeft;
		} else {
			arrived.left = atLeft;
			arrived.right = atRight;
		}
		internalX = scrollLeft;

		let scrollTop = container.scrollTop;
		if (container.ownerDocument && container === container.ownerDocument.documentElement) {
			scrollTop = scrollTop || container.ownerDocument.body.scrollTop;
		}

		directions.top = scrollTop < internalY;
		directions.bottom = scrollTop > internalY;
		const atTop = Math.abs(scrollTop) <= topOffset;
		const atBottom =
			Math.abs(scrollTop) + container.clientHeight >=
			container.scrollHeight - bottomOffset - ARRIVED_THRESHOLD_PIXELS;

		if (style.display === 'flex' && style.flexDirection === 'column-reverse') {
			arrived.top = atBottom;
			arrived.bottom = atTop;
		} else {
			arrived.top = atTop;
			arrived.bottom = atBottom;
		}
		internalY = scrollTop;
	}

	function endScrolling(event: Event) {
		// Dedupe with the native scrollend event.
		if (!isScrolling) return;
		isScrolling = false;
		directions.left = false;
		directions.right = false;
		directions.top = false;
		directions.bottom = false;
		onStop(event);
	}

	const endScrollingDebounced = useDebounceFn(endScrolling, throttle + idle);

	function onScrollHandler(event: Event) {
		if (!isBrowser) return;
		const rawTarget = (event.target as Document | null)?.documentElement ?? event.target;
		setArrived(scrollContainerOf(rawTarget as ScrollTarget));
		isScrolling = true;
		endScrollingDebounced(event);
		onScroll(event);
	}

	const handler = throttle > 0 ? useThrottleFn(onScrollHandler, throttle) : onScrollHandler;

	if (isBrowser) {
		const listenTarget = (): EventTarget | null | undefined => resolveGetter(target);
		useEventListener(listenTarget, 'scroll', handler, eventListenerOptions);
		useEventListener(listenTarget, 'scrollend', endScrolling, eventListenerOptions);

		$effect(() => {
			// Measure on mount.
			untrack(() => {
				try {
					const element = resolveGetter(target);
					if (element) setArrived(scrollContainerOf(element));
				} catch (error) {
					onError(error);
				}
			});
		});

		const observeMutation = typeof observe === 'boolean' ? observe : (observe.mutation ?? false);
		if (observeMutation) {
			useMutationObserver(
				() => {
					const element = resolveGetter(target);
					if (!element || isWindowTarget(element) || isDocumentTarget(element)) return undefined;
					return element;
				},
				() => measure(),
				{
					attributes: true,
					childList: true,
					subtree: true
				}
			);
		}
	}

	function measure() {
		if (!isBrowser) return;
		const element = resolveGetter(target);
		if (element) setArrived(scrollContainerOf(element));
	}

	return {
		get x() {
			return internalX;
		},
		set x(left: number) {
			scrollTo(left, undefined);
		},
		get y() {
			return internalY;
		},
		set y(top: number) {
			scrollTo(undefined, top);
		},
		get isScrolling() {
			return isScrolling;
		},
		get arrivedState() {
			return arrived;
		},
		get directions() {
			return directions;
		},
		measure
	};
}
