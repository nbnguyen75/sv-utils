import { isBrowser } from '../../shared/is.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Listener modifiers for {@link onLongPress}. */
export interface OnLongPressModifiers {
	/** Stop propagation. */
	stop?: boolean;
	/** Fire at most once. */
	once?: boolean;
	/** Prevent default. */
	prevent?: boolean;
	/** Use the capture phase. */
	capture?: boolean;
	/** Only handle events targeting the element itself. */
	self?: boolean;
}

/** Options for {@link onLongPress}. */
export interface OnLongPressOptions {
	/**
	 * Milliseconds until the handler fires, or a function computing it
	 * per press.
	 * @default 500
	 */
	delay?: number | ((event: PointerEvent) => number);
	/** Listener modifiers. */
	modifiers?: OnLongPressModifiers;
	/**
	 * Cancel when the pointer drifts this far (px) from the press point.
	 * `false` disables the check.
	 * @default 10
	 */
	distanceThreshold?: number | false;
	/**
	 * Called on release.
	 * @param duration Press length in ms.
	 * @param distance Drift from the press point in px.
	 * @param isLongPress Whether the delay elapsed before release.
	 * @param pointerEvent The native event.
	 */
	onMouseUp?: (
		duration: number,
		distance: number,
		isLongPress: boolean,
		pointerEvent: PointerEvent
	) => void;
}

/** Stop function returned by {@link onLongPress}. */
export type OnLongPressReturn = () => void;

const DEFAULT_DELAY = 500;
const DEFAULT_THRESHOLD = 10;

/**
 * Fire a handler when an element is pressed for a while.
 *
 * @param target Element (or getter) receiving presses.
 * @param handler Called once the delay elapses while held.
 * @param options Delay, drift threshold, modifiers, release callback.
 * @example
 * ```ts
 * const stop = onLongPress(() => button, () => openContextMenu(), {
 * 	delay: 400
 * });
 * ```
 */
export function onLongPress(
	target: MaybeElement,
	handler: (event: PointerEvent) => void,
	options: OnLongPressOptions = {}
): OnLongPressReturn {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let posStart: { x: number; y: number } | undefined;
	let startTimestamp: number | undefined;
	let hasLongPressed = false;
	let stopped = false;

	function clear() {
		if (timeout !== undefined) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		posStart = undefined;
		startTimestamp = undefined;
		hasLongPressed = false;
	}

	function getDelay(event: PointerEvent): number {
		const delay = options.delay;
		if (typeof delay === 'function') return delay(event);
		return delay ?? DEFAULT_DELAY;
	}

	function applyModifiers(event: PointerEvent, element: Element | null | undefined): boolean {
		if (options.modifiers?.self && event.target !== element) return false;
		if (options.modifiers?.prevent) event.preventDefault();
		if (options.modifiers?.stop) event.stopPropagation();
		return true;
	}

	function onRelease(event: Event) {
		if (stopped) return;
		const pointerEvent = event as PointerEvent;
		const [savedTimestamp, savedPos, savedLongPressed] = [startTimestamp, posStart, hasLongPressed];
		clear();
		if (!options.onMouseUp || !savedPos || savedTimestamp === undefined) return;
		if (!applyModifiers(pointerEvent, pointerEvent.currentTarget as Element | null)) return;
		const dx = pointerEvent.clientX - savedPos.x;
		const dy = pointerEvent.clientY - savedPos.y;
		options.onMouseUp(
			pointerEvent.timeStamp - savedTimestamp,
			Math.sqrt(dx * dx + dy * dy),
			savedLongPressed,
			pointerEvent
		);
	}

	function onDown(event: Event) {
		if (stopped) return;
		const pointerEvent = event as PointerEvent;
		// NOTE: the press target is the listener's element (upstream uses the
		// bound ref); `currentTarget` is that element while dispatching.
		const element =
			pointerEvent.currentTarget instanceof Element ? pointerEvent.currentTarget : null;
		if (!applyModifiers(pointerEvent, element)) return;
		clear();
		posStart = { x: pointerEvent.clientX, y: pointerEvent.clientY };
		startTimestamp = pointerEvent.timeStamp;
		timeout = setTimeout(() => {
			hasLongPressed = true;
			handler(pointerEvent);
		}, getDelay(pointerEvent));
	}

	function onMove(event: Event) {
		if (stopped) return;
		const pointerEvent = event as PointerEvent;
		const element =
			pointerEvent.currentTarget instanceof Element ? pointerEvent.currentTarget : null;
		if (!applyModifiers(pointerEvent, element)) return;
		if (!posStart || options.distanceThreshold === false) return;
		const dx = pointerEvent.clientX - posStart.x;
		const dy = pointerEvent.clientY - posStart.y;
		if (Math.sqrt(dx * dx + dy * dy) >= (options.distanceThreshold ?? DEFAULT_THRESHOLD)) {
			clear();
		}
	}

	if (isBrowser) {
		// NOTE: `capture`/`once` are assigned conditionally — an explicit
		// `undefined` is not assignable under exactOptionalPropertyTypes.
		const listenerOptions: AddEventListenerOptions = {};
		if (options.modifiers?.capture !== undefined) {
			listenerOptions.capture = options.modifiers.capture;
		}
		if (options.modifiers?.once !== undefined) {
			listenerOptions.once = options.modifiers.once;
		}
		useEventListener(target, 'pointerdown', onDown, listenerOptions);
		useEventListener(target, 'pointermove', onMove, listenerOptions);
		for (const name of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
			useEventListener(target, name, onRelease, listenerOptions);
		}
		// A pending timer must not fire after unmount.
		$effect(() => () => clear());
	}

	return () => {
		stopped = true;
		clear();
	};
}
