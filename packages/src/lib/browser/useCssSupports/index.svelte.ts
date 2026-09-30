import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options for {@link useCssSupports}. */
export interface UseCssSupportsOptions {
	/**
	 * Window to query. `null` disables.
	 * @default window
	 */
	window?: Window | null;
	/**
	 * Value reported before mount (hydration safety).
	 * @default false
	 */
	ssrValue?: boolean;
}

/** State returned by {@link useCssSupports}. */
export interface UseCssSupportsReturn {
	/** Whether the CSS feature is supported. Getter-backed. */
	readonly isSupported: boolean;
}

/**
 * Reactive `CSS.supports()` query.
 *
 * @param property CSS property name.
 * @param value CSS value to test the property against.
 * @param options Window and pre-mount value.
 * @example
 * ```ts
 * const grid = useCssSupports('display', 'grid');
 * grid.isSupported; // true in modern browsers
 * ```
 */
export function useCssSupports(
	property: MaybeGetter<string>,
	value: MaybeGetter<string>,
	options?: UseCssSupportsOptions
): UseCssSupportsReturn;
/**
 * Reactive `CSS.supports()` condition query.
 *
 * @param conditionText Full condition, e.g. `'(display: grid)'`.
 * @param options Window and pre-mount value.
 * @example
 * ```ts
 * const grid = useCssSupports('(display: grid)');
 * ```
 */
export function useCssSupports(
	conditionText: MaybeGetter<string>,
	options?: UseCssSupportsOptions
): UseCssSupportsReturn;

// Implementation
export function useCssSupports(
	propOrCondition: MaybeGetter<string>,
	valueOrOptions?: MaybeGetter<string> | UseCssSupportsOptions,
	maybeOptions?: UseCssSupportsOptions
): UseCssSupportsReturn {
	let options: UseCssSupportsOptions = {};
	let prop: MaybeGetter<string>;
	let value: MaybeGetter<string> | undefined;
	if (maybeOptions !== undefined) {
		prop = propOrCondition;
		value = valueOrOptions as MaybeGetter<string>;
		options = maybeOptions;
	} else if (
		valueOrOptions !== undefined &&
		typeof valueOrOptions !== 'string' &&
		typeof valueOrOptions !== 'function'
	) {
		prop = propOrCondition;
		options = valueOrOptions;
	} else {
		prop = propOrCondition;
		value = valueOrOptions as MaybeGetter<string> | undefined;
	}
	const { window: winOption, ssrValue = false } = options;

	function getWindow(): Window | undefined {
		if (winOption === undefined) {
			return isBrowser && typeof window !== 'undefined' ? window : undefined;
		}
		return winOption ?? undefined;
	}

	function query(): boolean {
		if (!isBrowser) return ssrValue;
		// NOTE: the installed TS lib does not type `Window.CSS`; the cast
		// documents the gap instead of hiding it.
		const supports = (getWindow() as (Window & { CSS?: typeof CSS }) | undefined)?.CSS?.supports;
		if (typeof supports !== 'function') return false;
		const property = resolveGetter(prop);
		return value === undefined ? supports(property) : supports(property, resolveGetter(value));
	}

	// Derived, not $state+$effect: the query re-runs on read whenever an
	// input changes, with no mount flag to maintain.
	const supported = $derived.by(() => query());

	return {
		get isSupported() {
			return supported;
		}
	};
}
