import type { MaybeElement } from '../../shared/getter/index.ts';
import type { UseMouseOptions } from '../useMouse/index.svelte.ts';

import { useMutationObserver } from '../../elements/useMutationObserver/index.svelte.ts';
import { useResizeObserver } from '../../elements/useResizeObserver/index.svelte.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import { useMouse } from '../useMouse/index.svelte.ts';

/** Options for {@link useMouseInElement}. */
export interface MouseInElementOptions extends UseMouseOptions {
	/**
	 * Keep reporting coordinates outside the element bounds.
	 * @default true
	 */
	handleOutside?: boolean;
	/**
	 * Refresh on window scroll.
	 * @default true
	 */
	windowScroll?: boolean;
	/**
	 * Refresh on window resize.
	 * @default true
	 */
	windowResize?: boolean;
}

/** State returned by {@link useMouseInElement}. */
export interface UseMouseInElementReturn {
	/** Latest input kind. Getter-backed. */
	readonly sourceType: 'mouse' | 'touch' | null;
	/** Element's page X. Getter-backed. */
	readonly elementPositionX: number;
	/** Element's page Y. Getter-backed. */
	readonly elementPositionY: number;
	/** Element height. Getter-backed. */
	readonly elementHeight: number;
	/** Element width. Getter-backed. */
	readonly elementWidth: number;
	/** Whether the pointer sits outside the element. Getter-backed. */
	readonly isOutside: boolean;
	/** X relative to the element. Getter-backed. */
	readonly elementX: number;
	/** Y relative to the element. Getter-backed. */
	readonly elementY: number;
	/** Global pointer x. Getter-backed. */
	readonly x: number;
	/** Global pointer y. Getter-backed. */
	readonly y: number;
	/** Detach all observers and listeners permanently. */
	stop(): void;
}

/**
 * Track the pointer relative to an element.
 *
 * @param target Element or getter (defaults to `document.body`).
 * @param options Mouse options plus outside/scroll/resize handling.
 * @example
 * ```ts
 * const pointer = useMouseInElement(() => card);
 * pointer.elementX; // X relative to card
 * ```
 */
export function useMouseInElement(
	target?: MaybeElement,
	options: MouseInElementOptions = {}
): UseMouseInElementReturn {
	const { windowScroll = true, windowResize = true, handleOutside = true, type = 'page' } = options;

	const mouse = useMouse(options);

	let elementX = $state(0);
	let elementY = $state(0);
	let elementPositionX = $state(0);
	let elementPositionY = $state(0);
	let elementHeight = $state(0);
	let elementWidth = $state(0);
	let isOutside = $state(true);
	let stopped = false;

	function update() {
		if (!isBrowser || stopped) return;
		const element =
			target === undefined ? document.body : (resolveGetter(target) as Element | null);
		// NOTE: never read elementX/elementY/elementPosition*/isOutside here:
		// reading and writing the same signal inside one effect re-triggers
		// it (converging only after a wasted second run). Locals below.
		if (!element || typeof element.getClientRects !== 'function') return;
		for (const rect of element.getClientRects()) {
			const pageX = isBrowser ? window.pageXOffset : 0;
			const pageY = isBrowser ? window.pageYOffset : 0;
			const positionX = rect.left + (type === 'page' ? pageX : 0);
			const positionY = rect.top + (type === 'page' ? pageY : 0);
			const relativeX = mouse.x - positionX;
			const relativeY = mouse.y - positionY;
			const outside =
				rect.width === 0 ||
				rect.height === 0 ||
				relativeX < 0 ||
				relativeY < 0 ||
				relativeX > rect.width ||
				relativeY > rect.height;

			elementPositionX = positionX;
			elementPositionY = positionY;
			elementHeight = rect.height;
			elementWidth = rect.width;
			isOutside = outside;

			if (handleOutside || !outside) {
				elementX = relativeX;
				elementY = relativeY;
			}
			if (!outside) break;
		}
	}

	function stop() {
		stopped = true;
		resizeStop();
		mutationStop();
	}

	const { stop: resizeStop } = useResizeObserver(
		target ?? (() => (isBrowser ? document.body : undefined)),
		() => update()
	);
	const { stop: mutationStop } = useMutationObserver(
		target ?? (() => (isBrowser ? document.body : undefined)),
		() => update(),
		{ attributeFilter: ['style', 'class'] }
	);

	if (isBrowser) {
		$effect(() => {
			// update() reads the pointer position and the target, so this
			// effect subscribes to both; its writes target other signals.
			update();
		});

		useEventListener(
			() => document,
			'mouseleave',
			() => {
				isOutside = true;
			},
			{ passive: true }
		);

		if (windowScroll) {
			useEventListener(
				() => window,
				'scroll',
				() => update(),
				{
					capture: true,
					passive: true
				}
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
	}

	return {
		get x() {
			return mouse.x;
		},
		get y() {
			return mouse.y;
		},
		get sourceType() {
			return mouse.sourceType;
		},
		get elementX() {
			return elementX;
		},
		get elementY() {
			return elementY;
		},
		get elementPositionX() {
			return elementPositionX;
		},
		get elementPositionY() {
			return elementPositionY;
		},
		get elementHeight() {
			return elementHeight;
		},
		get elementWidth() {
			return elementWidth;
		},
		get isOutside() {
			return isOutside;
		},
		stop
	};
}
