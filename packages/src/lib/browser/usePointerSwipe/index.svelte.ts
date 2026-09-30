import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import type { PointerType } from '../usePointer/index.svelte.ts';
import type { SwipePosition, UseSwipeDirection } from '../useSwipe/index.svelte.ts';

/** Options for {@link usePointerSwipe}. */
export interface UsePointerSwipeOptions {
	/**
	 * Minimum travel (px) before a gesture counts as a swipe.
	 * @default 50
	 */
	threshold?: number;
	/** Called on swipe start. */
	onSwipeStart?: (event: PointerEvent) => void;
	/** Called on swipe moves. */
	onSwipe?: (event: PointerEvent) => void;
	/** Called on swipe end. */
	onSwipeEnd?: (event: PointerEvent, direction: UseSwipeDirection) => void;
	/**
	 * Pointer types to listen to.
	 * @default ['mouse', 'touch', 'pen']
	 */
	pointerTypes?: PointerType[];
	/**
	 * Disable text selection on the target while swiping.
	 * @default false
	 */
	disableTextSelect?: boolean;
}

/** State returned by {@link usePointerSwipe}. */
export interface UsePointerSwipeReturn {
	/** Whether a swipe is in progress. Getter-backed. */
	readonly isSwiping: boolean;
	/** Swipe direction (`'none'` below the threshold). Getter-backed. */
	readonly direction: UseSwipeDirection;
	/** Press-start coordinates. Getter-backed (read-only by contract). */
	readonly posStart: SwipePosition;
	/** Latest coordinates. Getter-backed (read-only by contract). */
	readonly posEnd: SwipePosition;
	/** Horizontal travel (`start − end`). Getter-backed. */
	readonly distanceX: number;
	/** Vertical travel (`start − end`). Getter-backed. */
	readonly distanceY: number;
	/** Silence the instance permanently. */
	stop(): void;
}

/**
 * Reactive swipe detection based on PointerEvents.
 *
 * @param target Element (or getter) receiving pointer events.
 * @param options Threshold, pointer-type filter, and swipe callbacks.
 * @example
 * ```ts
 * const { direction } = usePointerSwipe(() => card, { threshold: 30 });
 * direction; // 'left' once the threshold is crossed
 * ```
 */
export function usePointerSwipe(
	target: MaybeGetter<HTMLElement | null | undefined>,
	options: UsePointerSwipeOptions = {}
): UsePointerSwipeReturn {
	const {
		threshold = 50,
		onSwipe,
		onSwipeEnd,
		onSwipeStart,
		pointerTypes,
		disableTextSelect = false
	} = options;

	const posStart = $state<SwipePosition>({ x: 0, y: 0 });
	const posEnd = $state<SwipePosition>({ x: 0, y: 0 });
	let isSwiping = $state(false);
	let isPointerDown = $state(false);
	let stopped = false;

	function distanceX(): number {
		return posStart.x - posEnd.x;
	}

	function distanceY(): number {
		return posStart.y - posEnd.y;
	}

	function isThresholdExceeded(): boolean {
		return Math.max(Math.abs(distanceX()), Math.abs(distanceY())) >= threshold;
	}

	function getDirection(): UseSwipeDirection {
		if (!isThresholdExceeded()) return 'none';
		const dx = distanceX();
		const dy = distanceY();
		if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'left' : 'right';
		return dy > 0 ? 'up' : 'down';
	}

	function eventIsAllowed(event: PointerEvent): boolean {
		const isReleasingButton = event.buttons === 0;
		const isPrimaryButton = event.buttons === 1;
		return (
			pointerTypes?.includes(event.pointerType as PointerType) ??
			(isReleasingButton || isPrimaryButton)
		);
	}

	function onPointerDown(event: Event) {
		if (stopped) return;
		const pointerEvent = event as PointerEvent;
		if (!eventIsAllowed(pointerEvent)) return;
		isPointerDown = true;
		// Future pointer events retarget to the element until up/cancel.
		const eventTarget = pointerEvent.target as HTMLElement | undefined;
		if (typeof eventTarget?.setPointerCapture === 'function') {
			try {
				eventTarget.setPointerCapture(pointerEvent.pointerId);
			} catch {
				// Pointer capture is best-effort (unsupported targets).
			}
		}
		posStart.x = pointerEvent.clientX;
		posStart.y = pointerEvent.clientY;
		posEnd.x = pointerEvent.clientX;
		posEnd.y = pointerEvent.clientY;
		onSwipeStart?.(pointerEvent);
	}

	function onPointerMove(event: Event) {
		if (stopped) return;
		const pointerEvent = event as PointerEvent;
		if (!eventIsAllowed(pointerEvent)) return;
		if (!isPointerDown) return;
		posEnd.x = pointerEvent.clientX;
		posEnd.y = pointerEvent.clientY;
		if (!isSwiping && isThresholdExceeded()) isSwiping = true;
		if (isSwiping) onSwipe?.(pointerEvent);
	}

	function onPointerUp(event: Event) {
		if (stopped) return;
		const pointerEvent = event as PointerEvent;
		if (!eventIsAllowed(pointerEvent)) return;
		if (isSwiping) onSwipeEnd?.(pointerEvent, getDirection());
		isPointerDown = false;
		isSwiping = false;
	}

	if (isBrowser) {
		useEventListener(target, 'pointerdown', onPointerDown, { passive: true });
		useEventListener(target, 'pointermove', onPointerMove, { passive: true });
		useEventListener(target, 'pointerup', onPointerUp, { passive: true });
		useEventListener(target, 'pointercancel', onPointerUp, { passive: true });

		$effect(() => {
			const element = resolveGetter(target);
			if (!element) return;
			// Allow vertical scrolling, disable horizontal scrolling by touch.
			element.style.setProperty('touch-action', 'pan-y');
			if (disableTextSelect) {
				element.style.setProperty('-webkit-user-select', 'none');
				element.style.setProperty('-ms-user-select', 'none');
				element.style.setProperty('user-select', 'none');
			}
		});
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
		get posStart() {
			return posStart;
		},
		get posEnd() {
			return posEnd;
		},
		get distanceX() {
			return distanceX();
		},
		get distanceY() {
			return distanceY();
		},
		stop
	};
}
