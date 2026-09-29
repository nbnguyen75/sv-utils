import type { MaybeElement } from '../../shared/getter/index.ts';

import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';

/** Focus state returned by {@link useFocusWithin}. */
export interface UseFocusWithinReturn {
	/** Whether the element or a descendant holds focus. Getter-backed. */
	readonly focused: boolean;
}

/**
 * Track focus containment.
 *
 * @param target Element or getter (e.g. `bind:this` state).
 * @example
 * ```ts
 * const { focused } = useFocusWithin(() => dialog);
 * focused; // focus inside dialog or descendants
 * ```
 */
export function useFocusWithin(target: MaybeElement): UseFocusWithinReturn {
	let focused = $state(false);

	if (isBrowser) {
		useEventListener(
			target,
			'focusin',
			() => {
				focused = true;
			},
			{ passive: true }
		);
		useEventListener(
			target,
			'focusout',
			() => {
				const element = resolveGetter(target);
				focused = element?.matches?.(':focus-within') ?? false;
			},
			{ passive: true }
		);
	}

	return {
		get focused() {
			return focused;
		}
	};
}
