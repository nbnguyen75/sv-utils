import { isBrowser } from '../../shared/is.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Coordinate source. */
export type UseMouseCoordType = 'page' | 'client' | 'screen' | 'movement';

/** Which input produced the latest position. */
export type UseMouseSourceType = 'mouse' | 'touch' | null;

/** Custom coordinate extractor. */
export type UseMouseEventExtractor = (
	event: MouseEvent | Touch
) => [x: number, y: number] | null | undefined;

/** Position. */
export interface UseMousePosition {
	x: number;
	y: number;
}

/** Options for {@link useMouse}. */
export interface UseMouseOptions {
	/**
	 * Coordinate system, or a custom extractor.
	 * @default 'page'
	 */
	type?: UseMouseCoordType | UseMouseEventExtractor;
	/**
	 * Element (or getter) listening for pointer events.
	 * @default window
	 */
	target?: MaybeGetter<Window | EventTarget | null | undefined>;
	/**
	 * Listen to touch events.
	 * @default true
	 */
	touch?: boolean;
	/**
	 * Adjust page coordinates on scroll.
	 * @default true
	 */
	scroll?: boolean;
	/**
	 * Reset to the initial value on `touchend`.
	 * @default false
	 */
	resetOnTouchEnds?: boolean;
	/**
	 * Initial values.
	 */
	initialValue?: UseMousePosition;
}

/** State returned by {@link useMouse}. */
export interface UseMouseReturn {
	/** Horizontal position. Getter-backed (destructure-safe). */
	readonly x: number;
	/** Vertical position. Getter-backed (destructure-safe). */
	readonly y: number;
	/** Latest input kind. Getter-backed. */
	readonly sourceType: UseMouseSourceType;
}

function builtinExtractor(type: UseMouseCoordType): UseMouseEventExtractor {
	switch (type) {
		case 'page':
			return (event) => [event.pageX, event.pageY];
		case 'client':
			return (event) => [event.clientX, event.clientY];
		case 'screen':
			return (event) => [event.screenX, event.screenY];
		case 'movement':
			return (event) =>
				'movementX' in event ? [event.movementX as number, event.movementY as number] : null;
	}
}

/**
 * Track the pointer position.
 *
 * @param options Coordinate type, target, touch/scroll behavior, initials.
 * @example
 * ```ts
 * const { x, y } = useMouse();
 * x; // pointer page X
 * ```
 */
export function useMouse(options: UseMouseOptions = {}): UseMouseReturn {
	const {
		type = 'page',
		touch = true,
		resetOnTouchEnds = false,
		initialValue = { x: 0, y: 0 },
		scroll = true
	} = options;

	let x = $state(initialValue.x);
	let y = $state(initialValue.y);
	let sourceType = $state<UseMouseSourceType>(null);

	let previousEvent: MouseEvent | null = null;
	let previousScrollX = 0;
	let previousScrollY = 0;

	const extractor = typeof type === 'function' ? type : builtinExtractor(type);

	function currentWindow(): Window | undefined {
		return isBrowser ? window : undefined;
	}

	function mouseHandler(event: Event) {
		const mouse = event as MouseEvent;
		const result = extractor(mouse);
		previousEvent = mouse;
		if (result) {
			x = result[0];
			y = result[1];
			sourceType = 'mouse';
		}
		const current = currentWindow();
		if (current) {
			previousScrollX = current.scrollX;
			previousScrollY = current.scrollY;
		}
	}

	function touchHandler(event: Event) {
		const touchEvent = event as TouchEvent;
		if (touchEvent.touches.length > 0) {
			const touch = touchEvent.touches[0];
			if (touch) {
				const result = extractor(touch);
				if (result) {
					x = result[0];
					y = result[1];
					sourceType = 'touch';
				}
			}
		}
	}

	function scrollHandler() {
		const current = currentWindow();
		if (!previousEvent || !current) return;
		const position = extractor(previousEvent);
		if ('movementX' in previousEvent && position) {
			x = position[0] + current.scrollX - previousScrollX;
			y = position[1] + current.scrollY - previousScrollY;
		}
	}

	function reset() {
		x = initialValue.x;
		y = initialValue.y;
	}

	if (isBrowser) {
		const target = options.target ?? (() => window);
		const listenerOptions = { passive: true } as const;
		for (const name of ['mousemove', 'dragover'] as const) {
			useEventListener(target, name, mouseHandler, listenerOptions);
		}
		if (touch && type !== 'movement') {
			for (const name of ['touchstart', 'touchmove'] as const) {
				useEventListener(target, name, touchHandler, listenerOptions);
			}
			if (resetOnTouchEnds) {
				useEventListener(target, 'touchend', reset, listenerOptions);
			}
		}
		if (scroll && type === 'page') {
			useEventListener(() => window, 'scroll', scrollHandler, listenerOptions);
		}
	}

	return {
		get x() {
			return x;
		},
		get y() {
			return y;
		},
		get sourceType() {
			return sourceType;
		}
	};
}
