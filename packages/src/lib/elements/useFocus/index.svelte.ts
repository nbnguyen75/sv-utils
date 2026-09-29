/**
 * Track or set an element's focus state.
 *
 * Inspired by [VueUse `useFocus`](https://vueuse.org/core/useFocus/).
 * Listens to focus/blur on the target; assigning `focused` focuses or
 * blurs it. Re-applies `initialValue` whenever the target swaps. Must be
 * called in component initialization. Server value is `initialValue`.
 * Disposal on unmount is automatic.
 */
import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';

/** Options for {@link useFocus}. */
export interface UseFocusOptions {
	/**
	 * Starting (and target-swap) value; `true` focuses on mount.
	 * @default false
	 */
	initialValue?: boolean;
	/**
	 * Only count `:focus-visible` matches as focused.
	 * @default false
	 */
	focusVisible?: boolean;
	/**
	 * Passed to `focus()` to suppress scrolling.
	 * @default false
	 */
	preventScroll?: boolean;
}

/** Focus state returned by {@link useFocus}. */
export interface UseFocusReturn {
	/**
	 * Read for focus state; assign `true` to focus, `false` to blur.
	 * Getter/setter-backed (destructure-safe).
	 */
	focused: boolean;
}

/**
 * Track and control element focus.
 *
 * @param target Element or getter (e.g. `bind:this` state).
 * @param options Initial value, focus-visible mode, and scroll behavior.
 */
export function useFocus(target: MaybeElement, options: UseFocusOptions = {}): UseFocusReturn {
	const { initialValue = false, focusVisible = false, preventScroll = false } = options;

	let innerFocused = $state(initialValue);

	if (isBrowser) {
		useEventListener(
			target,
			'focus',
			(event) => {
				if (!focusVisible || (event.target as HTMLElement).matches?.(':focus-visible')) {
					innerFocused = true;
				}
			},
			{ passive: true }
		);
		useEventListener(
			target,
			'blur',
			() => {
				innerFocused = false;
			},
			{ passive: true }
		);

		$effect(() => {
			// Re-apply the initial value whenever the target swaps.
			resolveGetter(target);
			untrack(() => {
				innerFocused = initialValue;
			});
		});
	}

	function focusElement() {
		const element = resolveGetter(target) as HTMLElement | null | undefined;
		element?.focus({ preventScroll });
	}

	function blurElement() {
		const element = resolveGetter(target) as HTMLElement | null | undefined;
		element?.blur();
	}

	return {
		get focused() {
			return innerFocused;
		},
		set focused(next: boolean) {
			if (!next && innerFocused) blurElement();
			else if (next && !innerFocused) focusElement();
		}
	};
}
