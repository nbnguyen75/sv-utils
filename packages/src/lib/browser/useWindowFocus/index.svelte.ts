import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Focus state returned by {@link useWindowFocus}. */
export interface UseWindowFocusReturn {
	/** Whether the window currently holds focus. Getter-backed. */
	readonly value: boolean;
}

/**
 * Track window focus.
 * @example
 * ```ts
 * const focused = useWindowFocus();
 * focused.value; // window focus state
 * ```
 */
export function useWindowFocus(): UseWindowFocusReturn {
	let focused = $state(isBrowser ? document.hasFocus() : false);

	if (isBrowser) {
		const options = { passive: true } as const;
		useEventListener(
			() => window,
			'blur',
			() => {
				focused = false;
			},
			options
		);
		useEventListener(
			() => window,
			'focus',
			() => {
				focused = true;
			},
			options
		);
	}

	return {
		get value() {
			return focused;
		}
	};
}
