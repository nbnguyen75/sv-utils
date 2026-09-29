import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';

/** Reduced-transparency preference. */
export type ReducedTransparencyType = 'reduce' | 'no-preference';

/** Transparency state returned by {@link usePreferredReducedTransparency}. */
export interface UsePreferredReducedTransparencyReturn {
	/** Effective preference. Getter-backed (destructure-safe). */
	readonly value: ReducedTransparencyType;
}

/**
 * Track whether the OS requests reduced transparency.
 * @example
 * ```ts
 * const transparency = usePreferredReducedTransparency();
 * transparency.value; // 'reduce' | 'no-preference'
 * ```
 */
export function usePreferredReducedTransparency(): UsePreferredReducedTransparencyReturn {
	const isReduced = useMediaQuery('(prefers-reduced-transparency: reduce)');

	const transparency = $derived.by((): ReducedTransparencyType => {
		if (isReduced.value) return 'reduce';
		return 'no-preference';
	});

	return {
		get value() {
			return transparency;
		}
	};
}
