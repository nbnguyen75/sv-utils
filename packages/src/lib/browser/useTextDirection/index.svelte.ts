import { isBrowser } from '../../shared/is.ts';

/** Text direction values. */
export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto';

/** Options for {@link useTextDirection}. */
export interface UseTextDirectionOptions {
	/**
	 * Server and pre-mount value.
	 * @default 'ltr'
	 */
	initialValue?: UseTextDirectionValue;
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
 * @example
 * ```ts
 * const dir = useTextDirection({ observe: true });
 * dir.value = 'rtl'; // writes document.dir
 * ```
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
