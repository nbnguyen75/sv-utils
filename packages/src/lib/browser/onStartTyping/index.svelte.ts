import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/**
 * Whether the focused element accepts text input. SSR-safe (`false`
 * without a DOM).
 */
export function isFocusedElementEditable(): boolean {
	if (typeof document === 'undefined') return false;
	const { activeElement, body } = document;
	if (!activeElement) return false;
	// No focus target means not editable.
	if (activeElement === body) return false;
	// Assume <input> and <textarea> elements are editable.
	switch (activeElement.tagName) {
		case 'INPUT':
		case 'TEXTAREA':
			return true;
	}
	// Check whether any other focused element is editable.
	return activeElement.hasAttribute('contenteditable');
}

/**
 * Whether the keystroke is a plain typeable character (A–Z, 0–9 with no
 * modifiers).
 */
export function isTypedCharValid(event: KeyboardEvent): boolean {
	const { keyCode, metaKey, ctrlKey, altKey } = event;
	if (metaKey || ctrlKey || altKey) return false;
	// 0...9
	if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) return true;
	// A...Z
	if (keyCode >= 65 && keyCode <= 90) return true;
	// All other keys.
	return false;
}

/** Options for {@link onStartTyping}. */
export interface OnStartTypingOptions {
	/** Custom typeable-character check. */
	isTypedCharValid?: (event: KeyboardEvent) => boolean;
	/** Custom editable-focus check. */
	isFocusedElementEditable?: () => boolean;
	/**
	 * Document receiving key events. `null` disables listening.
	 * @default document
	 */
	document?: Document | null;
}

/**
 * Fire a callback when the user starts typing while no editable element
 * is focused.
 *
 * @param callback Called with the first typeable keystroke.
 * @param options Document and custom validity checks.
 * @example
 * ```ts
 * const stop = onStartTyping((event) => {
 * 	search.focus();
 * });
 * ```
 */
export function onStartTyping(
	callback: (event: KeyboardEvent) => void,
	options: OnStartTypingOptions = {}
): () => void {
	const {
		document: doc,
		isTypedCharValid: isCharValid = isTypedCharValid,
		isFocusedElementEditable: isEditable = isFocusedElementEditable
	} = options;

	let resolvedDoc: Document | undefined;
	if (doc === undefined) {
		resolvedDoc = isBrowser && typeof document !== 'undefined' ? document : undefined;
	} else {
		resolvedDoc = doc ?? undefined;
	}

	let stopped = false;
	if (resolvedDoc) {
		const target = resolvedDoc;
		useEventListener(
			() => target,
			'keydown',
			(event) => {
				if (stopped) return;
				if (!isEditable() && isCharValid(event)) callback(event);
			},
			{ passive: true }
		);
	}

	return () => {
		stopped = true;
	};
}
