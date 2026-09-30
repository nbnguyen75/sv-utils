import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Modifier key tracked by {@link useKeyModifier}. */
export type KeyModifier =
	| 'Alt'
	| 'AltGraph'
	| 'CapsLock'
	| 'Control'
	| 'Fn'
	| 'FnLock'
	| 'Meta'
	| 'NumLock'
	| 'ScrollLock'
	| 'Shift'
	| 'Symbol'
	| 'SymbolLock';

/** Events that refresh the modifier state. */
export type UseKeyModifierEvent = 'mousedown' | 'mouseup' | 'keydown' | 'keyup';

/** Options for {@link useKeyModifier}. */
export interface UseKeyModifierOptions<Initial> {
	/**
	 * Events that refresh the modifier state.
	 * @default ['mousedown', 'mouseup', 'keydown', 'keyup']
	 */
	events?: UseKeyModifierEvent[];
	/**
	 * Document receiving the events. `null` disables listening.
	 * @default document
	 */
	document?: Document | null;
	/**
	 * Starting value.
	 * @default null
	 */
	initial?: Initial;
}

/**
 * Track a modifier key (Shift, Control, …).
 *
 * @param modifier Modifier to track.
 * @param options Refresh events, document, and initial value.
 * @example
 * ```ts
 * const shift = useKeyModifier('Shift', { initial: false });
 * shift.value; // true while Shift is held
 * ```
 */
export function useKeyModifier(
	modifier: KeyModifier,
	options: UseKeyModifierOptions<boolean> & { initial: boolean }
): {
	readonly value: boolean;
};
/**
 * Track a modifier key (Shift, Control, …).
 *
 * @param modifier Modifier to track.
 * @param options Refresh events, document, and initial value.
 * @example
 * ```ts
 * const control = useKeyModifier('Control');
 * control.value; // boolean | null (null until the first event)
 * ```
 */
export function useKeyModifier(
	modifier: KeyModifier,
	options?: UseKeyModifierOptions<boolean | null>
): {
	readonly value: boolean | null;
};

// Implementation
export function useKeyModifier(
	modifier: KeyModifier,
	options: UseKeyModifierOptions<boolean | null> = {}
): {
	readonly value: boolean | null;
} {
	const { events = ['mousedown', 'mouseup', 'keydown', 'keyup'], document: doc, initial } = options;

	// An explicit null document disables listening (it does NOT fall
	// back to the global document).
	let resolvedDoc: Document | undefined;
	if (doc === undefined) {
		resolvedDoc = isBrowser && typeof document !== 'undefined' ? document : undefined;
	} else {
		resolvedDoc = doc ?? undefined;
	}

	let state = $state<boolean | null>(initial ?? null);

	if (resolvedDoc) {
		const target = resolvedDoc;
		for (const name of events) {
			useEventListener(
				() => target,
				name,
				(event) => {
					const evt = event as MouseEvent | KeyboardEvent;
					if (typeof evt.getModifierState === 'function') {
						state = evt.getModifierState(modifier);
					}
				},
				{ passive: true }
			);
		}
	}

	return {
		get value() {
			return state;
		}
	};
}
