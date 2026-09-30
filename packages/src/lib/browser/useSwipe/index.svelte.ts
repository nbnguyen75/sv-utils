import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Swipe direction. */
export type UseSwipeDirection = 'up' | 'down' | 'left' | 'right' | 'none';

/** Point coordinates. */
export interface SwipePosition {
	/** Horizontal coordinate. */
	x: number;
	/** Vertical coordinate. */
	y: number;
}

/** Options for {@link useSwipe}. */
export interface UseSwipeOptions {
	/**
	 * Register events as passive.
	 * @default true
	 */
	passive?: boolean;
	/**
	 * Minimum travel (px) before a gesture counts as a swipe.
	 * @default 50
	 */
	threshold?: number;
	/** Called on swipe start. */
	onSwipeStart?: (event: TouchEvent) => void;
	/** Called on swipe moves. */
	onSwipe?: (event: TouchEvent) => void;
	/** Called on swipe end. */
	onSwipeEnd?: (event: TouchEvent, direction: UseSwipeDirection) => void;
}

/** State returned by {@link useSwipe}. */
export interface UseSwipeReturn {
	/** Whether a swipe is in progress. Getter-backed. */
	readonly isSwiping: boolean;
	/** Swipe direction (`'none'` below the threshold). Getter-backed. */
	readonly direction: UseSwipeDirection;
	/** Touch-start coordinates. Getter-backed (read-only by contract). */
	readonly coordsStart: SwipePosition;
	/** Latest touch coordinates. Getter-backed (read-only by contract). */
	readonly coordsEnd: SwipePosition;
	/** Horizontal travel (`start - end`). Getter-backed. */
	readonly lengthX: number;
	/** Vertical travel (`start - end`). Getter-backed. */
	readonly lengthY: number;
	/** Silence the instance permanently. */
	stop(): void;
}

/**
 * Reactive touch-swipe detection.
 *
 * @param target Element (or getter) receiving touch events.
 * @param options Threshold, passive mode, and swipe callbacks.
 * @example
 * ```ts
 * const { direction, isSwiping } = useSwipe(() => gallery);
 * direction; // 'left' once the threshold is crossed
 * ```
 */
export function useSwipe(
	target: MaybeGetter<EventTarget | null | undefined>,
	options: UseSwipeOptions = {}
): UseSwipeReturn {
	const { threshold = 50, onSwipe, onSwipeEnd, onSwipeStart, passive = true } = options;

	const coordsStart = $state<SwipePosition>({ x: 0, y: 0 });
	const coordsEnd = $state<SwipePosition>({ x: 0, y: 0 });
	let isSwiping = $state(false);
	let stopped = false;

	function diffX(): number {
		return coordsStart.x - coordsEnd.x;
	}

	function diffY(): number {
		return coordsStart.y - coordsEnd.y;
	}

	function isThresholdExceeded(): boolean {
		return Math.max(Math.abs(diffX()), Math.abs(diffY())) >= threshold;
	}

	function getDirection(): UseSwipeDirection {
		if (!isThresholdExceeded()) return 'none';
		const dx = diffX();
		const dy = diffY();
		if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'left' : 'right';
		return dy > 0 ? 'up' : 'down';
	}

	function touchCoords(event: TouchEvent): SwipePosition | undefined {
		const touch = event.touches[0];
		if (!touch) return undefined;
		return { x: touch.clientX, y: touch.clientY };
	}

	const listenerOptions = { passive, capture: !passive };

	function onTouchStart(event: Event) {
		if (stopped) return;
		const touchEvent = event as TouchEvent;
		if (touchEvent.touches.length !== 1) return;
		const coords = touchCoords(touchEvent);
		if (!coords) return;
		coordsStart.x = coords.x;
		coordsStart.y = coords.y;
		coordsEnd.x = coords.x;
		coordsEnd.y = coords.y;
		onSwipeStart?.(touchEvent);
	}

	function onTouchMove(event: Event) {
		if (stopped) return;
		const touchEvent = event as TouchEvent;
		if (touchEvent.touches.length !== 1) return;
		const coords = touchCoords(touchEvent);
		if (!coords) return;
		coordsEnd.x = coords.x;
		coordsEnd.y = coords.y;
		if (
			listenerOptions.capture &&
			!listenerOptions.passive &&
			Math.abs(diffX()) > Math.abs(diffY())
		) {
			touchEvent.preventDefault();
		}
		if (!isSwiping && isThresholdExceeded()) isSwiping = true;
		if (isSwiping) onSwipe?.(touchEvent);
	}

	function onTouchEnd(event: Event) {
		if (stopped) return;
		const touchEvent = event as TouchEvent;
		if (isSwiping) onSwipeEnd?.(touchEvent, getDirection());
		isSwiping = false;
	}

	if (isBrowser) {
		useEventListener(target, 'touchstart', onTouchStart, listenerOptions);
		useEventListener(target, 'touchmove', onTouchMove, listenerOptions);
		useEventListener(target, 'touchend', onTouchEnd, listenerOptions);
		useEventListener(target, 'touchcancel', onTouchEnd, listenerOptions);
	}

	function stop() {
		stopped = true;
	}

	return {
		get isSwiping() {
			return isSwiping;
		},
		get direction() {
			return getDirection();
		},
		get coordsStart() {
			return coordsStart;
		},
		get coordsEnd() {
			return coordsEnd;
		},
		get lengthX() {
			return diffX();
		},
		get lengthY() {
			return diffY();
		},
		stop
	};
}
