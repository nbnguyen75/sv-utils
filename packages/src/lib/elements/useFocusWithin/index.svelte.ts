/**
 * Track whether focus sits inside a target element.
 *
 * Inspired by [VueUse `useFocusWithin`](https://vueuse.org/core/useFocusWithin/).
 * `focusin` marks focused; `focusout` re-checks `:focus-within` (covers
 * focus moving between descendants). Must be called in component
 * initialization. Server value is `false`. Disposal on unmount is
 * automatic.
 */
import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';

/** Focus state returned by {@link useFocusWithin}. */
export interface UseFocusWithinReturn {
	/** Whether the element or a descendant holds focus. Getter-backed. */
	readonly focused: boolean;
}

/**
 * Track focus containment.
 *
 * @param target Element or getter (e.g. `bind:this` state).
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
