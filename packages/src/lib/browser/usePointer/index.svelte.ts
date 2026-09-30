import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Pointer input kind. */
export type PointerType = 'mouse' | 'pen' | 'touch';

/** Full pointer state. */
export interface UsePointerState {
	/** Horizontal position. */
	x: number;
	/** Vertical position. */
	y: number;
	/** Pressure of the pointer input. */
	pressure: number;
	/** Unique pointer identifier. */
	pointerId: number;
	/** Plane angle (degrees, -90 to 90) between pointer and screen. */
	tiltX: number;
	/** Plane angle (degrees, -90 to 90) between pointer and screen. */
	tiltY: number;
	/** Width (magnitude on the X axis) of the contact geometry. */
	width: number;
	/** Height (magnitude on the Y axis) of the contact geometry. */
	height: number;
	/** Clockwise rotation (degrees, 0 to 359) of the transducer. */
	twist: number;
	/** Latest input kind. */
	pointerType: PointerType | null;
}

/** Options for {@link usePointer}. */
export interface UsePointerOptions {
	/**
	 * Pointer types to listen to. All types are tracked when omitted.
	 */
	pointerTypes?: PointerType[];
	/**
	 * Starting state. Resolved once at creation.
	 */
	initialValue?: MaybeGetter<Partial<UsePointerState>>;
	/**
	 * Element (or getter) receiving pointer events.
	 * @default window
	 */
	target?: MaybeGetter<EventTarget | null | undefined>;
}

/** State returned by {@link usePointer}. */
export interface UsePointerReturn {
	/** Horizontal position. Getter-backed (destructure-safe). */
	readonly x: number;
	/** Vertical position. Getter-backed. */
	readonly y: number;
	/** Pressure of the pointer input. Getter-backed. */
	readonly pressure: number;
	/** Unique pointer identifier. Getter-backed. */
	readonly pointerId: number;
	/** Plane angle between pointer and screen. Getter-backed. */
	readonly tiltX: number;
	/** Plane angle between pointer and screen. Getter-backed. */
	readonly tiltY: number;
	/** Width of the contact geometry. Getter-backed. */
	readonly width: number;
	/** Height of the contact geometry. Getter-backed. */
	readonly height: number;
	/** Clockwise rotation of the transducer. Getter-backed. */
	readonly twist: number;
	/** Latest input kind. Getter-backed. */
	readonly pointerType: PointerType | null;
	/** Whether the pointer is currently over the target. Getter-backed. */
	readonly isInside: boolean;
}

const defaultState: UsePointerState = {
	x: 0,
	y: 0,
	pointerId: 0,
	pressure: 0,
	tiltX: 0,
	tiltY: 0,
	width: 0,
	height: 0,
	twist: 0,
	pointerType: null
};

/**
 * Track the full pointer state.
 *
 * @param options Pointer-type filter, initial value, and event target.
 * @example
 * ```ts
 * const pointer = usePointer();
 * pointer.x; // pointer clientX
 * pointer.pressure; // 0.5 while pressing
 * ```
 */
export function usePointer(options: UsePointerOptions = {}): UsePointerReturn {
	const { pointerTypes, target } = options;

	let isInside = $state(false);
	let state = $state<UsePointerState>({
		...defaultState,
		...resolveGetter(options.initialValue ?? {})
	});

	function handler(event: Event) {
		isInside = true;
		const pointer = event as PointerEvent;
		if (pointerTypes && !pointerTypes.includes(pointer.pointerType as PointerType)) return;
		state = {
			x: pointer.clientX,
			y: pointer.clientY,
			pressure: pointer.pressure,
			pointerId: pointer.pointerId,
			tiltX: pointer.tiltX,
			tiltY: pointer.tiltY,
			width: pointer.width,
			height: pointer.height,
			twist: pointer.twist,
			pointerType: pointer.pointerType as PointerType
		};
	}

	if (isBrowser) {
		const listenTarget = target ?? (() => window);
		for (const name of ['pointerdown', 'pointermove', 'pointerup'] as const) {
			useEventListener(listenTarget, name, handler, { passive: true });
		}
		for (const name of ['pointerleave', 'pointercancel'] as const) {
			useEventListener(
				listenTarget,
				name,
				() => {
					isInside = false;
				},
				{ passive: true }
			);
		}
	}

	return {
		get x() {
			return state.x;
		},
		get y() {
			return state.y;
		},
		get pressure() {
			return state.pressure;
		},
		get pointerId() {
			return state.pointerId;
		},
		get tiltX() {
			return state.tiltX;
		},
		get tiltY() {
			return state.tiltY;
		},
		get width() {
			return state.width;
		},
		get height() {
			return state.height;
		},
		get twist() {
			return state.twist;
		},
		get pointerType() {
			return state.pointerType;
		},
		get isInside() {
			return isInside;
		}
	};
}
