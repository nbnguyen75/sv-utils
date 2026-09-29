import { isBrowser } from '../../shared/is.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import type { UseMouseSourceType } from '../useMouse/index.svelte.ts';

/** Options for {@link useMousePressed}. */
export interface UseMousePressedOptions {
	/**
	 * Listen to touchstart/touchend/touchcancel.
	 * @default true
	 */
	touch?: boolean;
	/**
	 * Listen to dragstart/drop/dragend.
	 * @default true
	 */
	drag?: boolean;
	/**
	 * Capture-phase listeners.
	 * @default false
	 */
	capture?: boolean;
	/**
	 * Starting pressed state.
	 * @default false
	 */
	initialValue?: boolean;
	/**
	 * Element (or getter) receiving press starts; releases listen on window.
	 */
	target?: MaybeElement;
	/** Called when pressing starts. */
	onPressed?: (event: MouseEvent | TouchEvent | DragEvent) => void;
	/** Called when pressing ends. */
	onReleased?: (event: MouseEvent | TouchEvent | DragEvent) => void;
}

/** State returned by {@link useMousePressed}. */
export interface UseMousePressedReturn {
	/** Whether anything is pressed. Getter-backed. */
	readonly pressed: boolean;
	/** Latest input kind. Getter-backed. */
	readonly sourceType: UseMouseSourceType;
}

/**
 * Track pointer presses.
 *
 * @param options Touch/drag/capture flags, initial value, target, callbacks.
 * @example
 * ```ts
 * const { pressed } = useMousePressed();
 * pressed; // any button held
 * ```
 */
export function useMousePressed(options: UseMousePressedOptions = {}): UseMousePressedReturn {
	const {
		touch = true,
		drag = true,
		capture = false,
		initialValue = false,
		target,
		onPressed,
		onReleased
	} = options;

	let pressed = $state(initialValue);
	let sourceType = $state<UseMouseSourceType>(null);

	if (isBrowser) {
		const pressTarget = target ?? (() => window);

		const begin =
			(kind: UseMouseSourceType) =>
			(event: Event): void => {
				pressed = true;
				sourceType = kind;
				onPressed?.(event as MouseEvent & TouchEvent & DragEvent);
			};

		const end =
			() =>
			(event: Event): void => {
				pressed = false;
				sourceType = null;
				onReleased?.(event as MouseEvent & TouchEvent & DragEvent);
			};

		const listenerOptions = { capture, passive: true };
		useEventListener(pressTarget, 'mousedown', begin('mouse'), listenerOptions);
		useEventListener(() => window, 'mouseleave', end(), listenerOptions);
		useEventListener(() => window, 'mouseup', end(), listenerOptions);

		if (drag) {
			useEventListener(pressTarget, 'dragstart', begin('mouse'), listenerOptions);
			useEventListener(() => window, 'drop', end(), listenerOptions);
			useEventListener(() => window, 'dragend', end(), listenerOptions);
		}

		if (touch) {
			useEventListener(pressTarget, 'touchstart', begin('touch'), listenerOptions);
			useEventListener(() => window, 'touchend', end(), listenerOptions);
			useEventListener(() => window, 'touchcancel', end(), listenerOptions);
		}
	}

	return {
		get pressed() {
			return pressed;
		},
		get sourceType() {
			return sourceType;
		}
	};
}
