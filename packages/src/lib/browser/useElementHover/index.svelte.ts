import type { MaybeElement } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Options for {@link useElementHover}. */
export interface UseElementHoverOptions {
	/**
	 * Clear hover when the element leaves the DOM.
	 * @default false
	 */
	triggerOnRemoval?: boolean;
	/**
	 * Delay before reporting hover, in milliseconds.
	 * @default 0
	 */
	delayEnter?: number;
	/**
	 * Delay before reporting leave, in milliseconds.
	 * @default 0
	 */
	delayLeave?: number;
}

/** State returned by {@link useElementHover}. */
export interface UseElementHoverReturn {
	/** Whether the element is hovered. Getter-backed (destructure-safe). */
	readonly value: boolean;
}

/**
 * Track element hover.
 *
 * @param target Element or getter (e.g. `bind:this` state).
 * @param options Enter/leave delays and removal handling.
 * @example
 * ```ts
 * const hovered = useElementHover(() => card, { delayEnter: 100 });
 * hovered.value; // true shortly after enter
 * ```
 */
export function useElementHover(
	target: MaybeElement,
	options: UseElementHoverOptions = {}
): UseElementHoverReturn {
	const { delayEnter = 0, delayLeave = 0, triggerOnRemoval = false } = options;

	let hovered = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function flip(next: boolean) {
		const delay = next ? delayEnter : delayLeave;
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
		if (delay > 0) {
			timer = setTimeout(() => {
				timer = undefined;
				hovered = next;
			}, delay);
		} else {
			hovered = next;
		}
	}

	if (isBrowser) {
		$effect(() => {
			return () => {
				if (timer !== undefined) {
					clearTimeout(timer);
					timer = undefined;
				}
			};
		});

		useEventListener(target, 'mouseenter', () => flip(true), { passive: true });
		useEventListener(target, 'mouseleave', () => flip(false), { passive: true });

		if (triggerOnRemoval) {
			$effect(() => {
				const observer = new MutationObserver(() => {
					const element = resolveGetter(target);
					if (element && !element.isConnected) flip(false);
				});
				observer.observe(document, { childList: true, subtree: true });
				return () => {
					observer.disconnect();
				};
			});
		}
	}

	return {
		get value() {
			return hovered;
		}
	};
}
