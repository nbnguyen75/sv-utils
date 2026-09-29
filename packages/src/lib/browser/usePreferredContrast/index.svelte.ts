import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';

/** OS contrast preference. */
export type ContrastType = 'more' | 'less' | 'custom' | 'no-preference';

/** Contrast state returned by {@link usePreferredContrast}. */
export interface UsePreferredContrastReturn {
	/** Effective preference. Getter-backed (destructure-safe). */
	readonly value: ContrastType;
}

/**
 * Track the OS contrast preference.
 * @example
 * ```ts
 * const contrast = usePreferredContrast();
 * contrast.value; // 'more' | 'less' | 'custom' | 'no-preference'
 * ```
 */
export function usePreferredContrast(): UsePreferredContrastReturn {
	const isMore = useMediaQuery('(prefers-contrast: more)');
	const isLess = useMediaQuery('(prefers-contrast: less)');
	const isCustom = useMediaQuery('(prefers-contrast: custom)');

	const contrast = $derived.by((): ContrastType => {
		if (isMore.value) return 'more';
		if (isLess.value) return 'less';
		if (isCustom.value) return 'custom';
		return 'no-preference';
	});

	return {
		get value() {
			return contrast;
		}
	};
}
