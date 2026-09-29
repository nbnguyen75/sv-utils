/**
 * Reactive text direction (`dir`) of an element, writable back to the DOM.
 *
 * Inspired by [VueUse `useTextDirection`](https://vueuse.org/core/useTextDirection/).
 * Reads the selector target on mount (SSR renders `initialValue`) and,
 * with `observe`, follows attribute changes via `MutationObserver`.
 * Assigning `value` writes the attribute (removing it when emptied).
 * Must be called in component initialization. Disposal on unmount is
 * automatic.
 */
import { isBrowser } from '../../shared/is.ts';

/** Text direction values. */
export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto';

/** Options for {@link useTextDirection}. */
export interface UseTextDirectionOptions {
	/**
	 * Element receiving the direction.
	 * @default 'html'
	 */
	selector?: string;
	/**
	 * Follow `dir` attribute changes with a `MutationObserver`.
	 * @default false
	 */
	observe?: boolean;
	/**
	 * Server and pre-mount value.
	 * @default 'ltr'
	 */
	initialValue?: UseTextDirectionValue;
}

/** Direction state returned by {@link useTextDirection}. */
export interface UseTextDirectionReturn {
	/** Current direction. Getter/setter-backed (destructure-safe). */
	value: UseTextDirectionValue;
}

/**
 * Track (and control) an element's text direction.
 *
 * @param options `selector`, `observe`, and `initialValue` overrides.
 */
export function useTextDirection(options: UseTextDirectionOptions = {}): UseTextDirectionReturn {
	const { selector = 'html', observe = false, initialValue = 'ltr' } = options;

	function read(): UseTextDirectionValue {
		if (!isBrowser) return initialValue;
		const found = document.querySelector(selector)?.getAttribute('dir');
		return found === 'ltr' || found === 'rtl' || found === 'auto' ? found : initialValue;
	}

	function write(next: UseTextDirectionValue) {
		if (!isBrowser) return;
		const element = document.querySelector(selector);
		if (!element) return;
		if (next) element.setAttribute('dir', next);
		else element.removeAttribute('dir');
	}

	let direction = $state<UseTextDirectionValue>(read());

	$effect(() => {
		if (!isBrowser) return;
		// Re-read on mount: the server render may differ.
		direction = read();
		if (!observe) return;
		const element = document.querySelector(selector);
		if (!element || typeof MutationObserver === 'undefined') return;
		const observer = new MutationObserver(() => {
			direction = read();
		});
		observer.observe(element, { attributes: true, attributeFilter: ['dir'] });
		return () => {
			observer.disconnect();
		};
	});

	return {
		get value() {
			return direction;
		},
		set value(next: UseTextDirectionValue) {
			direction = next;
			write(next);
		}
	};
}
