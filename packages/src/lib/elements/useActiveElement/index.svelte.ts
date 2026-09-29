/**
 * Reactive `document.activeElement` with shadow-DOM and removal tracking.
 *
 * Inspired by [VueUse `useActiveElement`](https://vueuse.org/core/useActiveElement/).
 * Listens to capturing blur/focus on window and, with `triggerOnRemoval`,
 * re-resolves when the focused node leaves the DOM. Must be called in
 * component initialization. Server value is `undefined`. Disposal on
 * unmount is automatic.
 */
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';

/** Options for {@link useActiveElement}. */
export interface UseActiveElementOptions {
	/**
	 * Pierce shadow roots when resolving the active element.
	 * @default true
	 */
	deep?: boolean;
	/**
	 * Re-resolve when the focused node is removed from the DOM
	 * (via `MutationObserver`).
	 * @default false
	 */
	triggerOnRemoval?: boolean;
}

/** Active-element state returned by {@link useActiveElement}. */
export interface UseActiveElementReturn<T extends HTMLElement = HTMLElement> {
	/** Currently focused element (or `null`/`undefined`). Getter-backed. */
	readonly value: T | null | undefined;
}

/**
 * Track the focused element.
 *
 * @param options `deep` shadow piercing and `triggerOnRemoval` tracking.
 */
export function useActiveElement<T extends HTMLElement = HTMLElement>(
	options: UseActiveElementOptions = {}
): UseActiveElementReturn<T> {
	const { deep = true, triggerOnRemoval = false } = options;

	function current(): T | null | undefined {
		if (!isBrowser) return undefined;
		let element: Element | null | undefined = document.activeElement;
		if (deep) {
			while (element?.shadowRoot) {
				element = element.shadowRoot.activeElement;
			}
		}
		return element as T | null | undefined;
	}

	let active = $state<T | null | undefined>(current());

	function refresh() {
		active = current();
	}

	if (isBrowser) {
		useEventListener(
			() => window,
			'blur',
			(event) => {
				if ((event as FocusEvent).relatedTarget !== null) return;
				refresh();
			},
			{ capture: true, passive: true }
		);
		useEventListener(() => window, 'focus', refresh, { capture: true, passive: true });

		if (triggerOnRemoval) {
			$effect(() => {
				const observer = new MutationObserver(() => {
					refresh();
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
			return active;
		}
	};
}
