import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';

/** OS color-scheme preference. */
export type ColorSchemeType = 'dark' | 'light' | 'no-preference';

/** Scheme state returned by {@link usePreferredColorScheme}. */
export interface UsePreferredColorSchemeReturn {
	/** Effective scheme. Getter-backed (destructure-safe). */
	readonly value: ColorSchemeType;
}

/**
 * Track the OS color-scheme preference.
 * @example
 * ```ts
 * const scheme = usePreferredColorScheme();
 * scheme.value; // 'dark' | 'light' | 'no-preference'
 * ```
 */
export function usePreferredColorScheme(): UsePreferredColorSchemeReturn {
	const isLight = useMediaQuery('(prefers-color-scheme: light)');
	const isDark = useMediaQuery('(prefers-color-scheme: dark)');

	const scheme = $derived.by((): ColorSchemeType => {
		if (isDark.value) return 'dark';
		if (isLight.value) return 'light';
		return 'no-preference';
	});

	return {
		get value() {
			return scheme;
		}
	};
}
