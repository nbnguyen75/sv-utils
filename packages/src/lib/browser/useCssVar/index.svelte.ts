import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement, MaybeGetter } from '../../shared/getter/index.ts';
import { useMutationObserver } from '../../elements/useMutationObserver/index.svelte.ts';

/** Options for {@link useCssVar}. */
export interface UseCssVarOptions {
	/** Starting value, used until the first computed read. */
	initialValue?: string;
	/**
	 * Observe style/class mutations and re-read the variable.
	 * @default false
	 */
	observe?: boolean;
}

/** State returned by {@link useCssVar}. */
export interface UseCssVarReturn {
	/** Variable value. Assign to write. Getter/setter-backed. */
	value: string | undefined;
}

/**
 * Manipulate a CSS variable reactively, both directions.
 *
 * @param prop Variable name (or getter), e.g. `'--brand'`.
 * @param target Element (or getter) owning the variable.
 * @param options Initial value and external-change observation.
 * @example
 * ```ts
 * const brand = useCssVar('--brand', () => card, { initialValue: 'red' });
 * brand.value = 'blue'; // writes card's inline style
 * ```
 */
export function useCssVar(
	prop: MaybeGetter<string | null | undefined>,
	target?: MaybeElement,
	options: UseCssVarOptions = {}
): UseCssVarReturn {
	const { initialValue, observe = false } = options;

	let variable = $state<string | undefined>(initialValue);

	function currentElement(): HTMLElement | undefined {
		if (!isBrowser || typeof document === 'undefined') return undefined;
		const element = resolveGetter(target) ?? document.documentElement;
		return element as HTMLElement | undefined;
	}

	function readVar() {
		const key = resolveGetter(prop);
		const element = currentElement();
		if (!element || !key || typeof window === 'undefined') return;
		const computed = window.getComputedStyle(element).getPropertyValue(key)?.trim();
		// The fallback reads `variable` without subscribing: this effect
		// must not observe the signal it writes (read/write aliasing).
		untrack(() => {
			if (computed) variable = computed;
			else if (variable === undefined) variable = initialValue;
		});
	}

	if (isBrowser) {
		let previousKey: string | null | undefined;
		let previousElement: HTMLElement | undefined;

		$effect(() => {
			const key = resolveGetter(prop);
			const element = currentElement();
			const oldKey = previousKey;
			const oldElement = previousElement;
			previousKey = key;
			previousElement = element;
			if (oldElement && oldKey && (oldElement !== element || oldKey !== key)) {
				oldElement.style.removeProperty(oldKey);
			}
			readVar();
		});

		$effect(() => {
			const value = variable;
			const element = currentElement();
			const key = resolveGetter(prop);
			if (element && key) {
				if (value == null) element.style.removeProperty(key);
				else element.style.setProperty(key, value);
			}
		});

		if (observe) {
			useMutationObserver(
				() => currentElement(),
				() => readVar(),
				{ attributeFilter: ['style', 'class'] }
			);
		}
	}

	return {
		get value() {
			return variable;
		},
		set value(next: string | undefined) {
			variable = next;
		}
	};
}
