import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';
import type { UseMediaQueryReturn } from '../useMediaQuery/index.svelte.ts';

/** Breakpoint table: names to widths (`number` = px, or a CSS length). */
export type Breakpoints<K extends string = string> = Record<K, MaybeGetter<number | string>>;

/** Query strategy for per-key shortcuts. */
export type BreakpointStrategy = 'min-width' | 'max-width';

/** Options for {@link useBreakpoints}. */
export interface UseBreakpointsOptions {
	/**
	 * Shortcut semantics: `min-width` is mobile-first (`.lg` means
	 * viewport ≥ lg), `max-width` is desktop-first.
	 * @default 'min-width'
	 */
	strategy?: BreakpointStrategy;
}

/** Breakpoint state returned by {@link useBreakpoints}. */
export interface UseBreakpointsReturn<K extends string> {
	/** Sorted names of currently matching breakpoints. Getter-backed. */
	readonly current: K[];
	/** Highest (mobile-first) or lowest (desktop-first) match, `''` when none. Getter-backed. */
	readonly active: K | '';
	/** Match query for `k` under the configured strategy. */
	greaterOrEqual(k: MaybeGetter<K>): UseMediaQueryReturn;
	/** `(max-width: k)` query. */
	smallerOrEqual(k: MaybeGetter<K>): UseMediaQueryReturn;
	/** Strictly greater (excludes the exact boundary). */
	greater(k: MaybeGetter<K>): UseMediaQueryReturn;
	/** Strictly smaller (excludes the exact boundary). */
	smaller(k: MaybeGetter<K>): UseMediaQueryReturn;
	/** Between `a` (inclusive) and `b` (exclusive). */
	between(a: MaybeGetter<K>, b: MaybeGetter<K>): UseMediaQueryReturn;
	/** Synchronous check (no reactivity). */
	isGreater(k: MaybeGetter<K>): boolean;
	/** Synchronous check (no reactivity). */
	isGreaterOrEqual(k: MaybeGetter<K>): boolean;
	/** Synchronous check (no reactivity). */
	isSmaller(k: MaybeGetter<K>): boolean;
	/** Synchronous check (no reactivity). */
	isSmallerOrEqual(k: MaybeGetter<K>): boolean;
	/** Synchronous check (no reactivity). */
	isInBetween(a: MaybeGetter<K>, b: MaybeGetter<K>): boolean;
}

function pxValue(size: string): number {
	return Number.parseFloat(size);
}

function increaseWithUnit(value: number | string, delta: number): string {
	if (typeof value === 'number') return `${value + delta}px`;
	const match = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(value);
	if (!match) return `${value}`;
	return `${Number.parseFloat(match[1] as string) + delta}${match[2] ?? ''}`;
}

function asPx(value: number | string): string {
	return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Track viewport breakpoints.
 *
 * @param breakpoints Name-to-width table (numbers are pixels).
 * @param options `strategy` for per-key shortcuts.
 * @example
 * ```ts
 * import { breakpointsTailwind } from 'sv-utils';
 * const breakpoints = useBreakpoints(breakpointsTailwind);
 * breakpoints.lg.value; // viewport >= 1024px
 * ```
 */
export function useBreakpoints<K extends string>(
	breakpoints: Breakpoints<K>,
	options: UseBreakpointsOptions = {}
): UseBreakpointsReturn<K> & Record<K, UseMediaQueryReturn> {
	const { strategy = 'min-width' } = options;

	function getValue(k: MaybeGetter<K>, delta?: number): string {
		const raw = resolveGetter(breakpoints[resolveGetter(k)]);
		const sized = delta === undefined ? raw : increaseWithUnit(raw, delta);
		return asPx(sized);
	}

	function match(kind: 'min' | 'max', size: string): boolean {
		if (!isBrowser || typeof window.matchMedia !== 'function') return false;
		try {
			return window.matchMedia(`(${kind}-width: ${size})`).matches;
		} catch {
			return false;
		}
	}

	function greaterOrEqual(k: MaybeGetter<K>): UseMediaQueryReturn {
		return useMediaQuery(() => `(min-width: ${getValue(k)})`);
	}

	function smallerOrEqual(k: MaybeGetter<K>): UseMediaQueryReturn {
		return useMediaQuery(() => `(max-width: ${getValue(k)})`);
	}

	// Eager per-key shortcuts: keys are known upfront, so queries attach
	// once at setup instead of per render access.
	const shortcuts = {} as Record<K, UseMediaQueryReturn>;
	for (const key of Object.keys(breakpoints) as K[]) {
		shortcuts[key] = strategy === 'min-width' ? greaterOrEqual(key) : smallerOrEqual(key);
	}

	function currentPoints(): K[] {
		const names = Object.keys(breakpoints) as K[];
		const points = names.map((name) => ({ name, width: pxValue(getValue(name)) }));
		points.sort((a, b) => a.width - b.width);
		return points.filter((point) => shortcuts[point.name]?.value).map((point) => point.name);
	}

	const current = $derived(currentPoints());
	const active = $derived.by((): K | '' => {
		if (current.length === 0) return '';
		return (strategy === 'min-width' ? current[current.length - 1] : current[0]) as K;
	});

	return {
		...shortcuts,
		get current() {
			return current;
		},
		get active() {
			return active;
		},
		greaterOrEqual,
		smallerOrEqual,
		greater(k: MaybeGetter<K>) {
			return useMediaQuery(() => `(min-width: ${getValue(k, 0.1)})`);
		},
		smaller(k: MaybeGetter<K>) {
			return useMediaQuery(() => `(max-width: ${getValue(k, -0.1)})`);
		},
		between(a: MaybeGetter<K>, b: MaybeGetter<K>) {
			return useMediaQuery(
				() => `(min-width: ${getValue(a)}) and (max-width: ${getValue(b, -0.1)})`
			);
		},
		isGreater(k: MaybeGetter<K>) {
			return match('min', getValue(k, 0.1));
		},
		isGreaterOrEqual(k: MaybeGetter<K>) {
			return match('min', getValue(k));
		},
		isSmaller(k: MaybeGetter<K>) {
			return match('max', getValue(k, -0.1));
		},
		isSmallerOrEqual(k: MaybeGetter<K>) {
			return match('max', getValue(k));
		},
		isInBetween(a: MaybeGetter<K>, b: MaybeGetter<K>) {
			return match('min', getValue(a)) && match('max', getValue(b, -0.1));
		}
	};
}
