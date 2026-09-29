/**
 * Reactive OS color-scheme preference.
 *
 * Inspired by [VueUse `usePreferredColorScheme`](https://vueuse.org/core/usePreferredColorScheme/).
 * Combines the light/dark media queries into `'dark' | 'light' |
 * 'no-preference'`. Must be called in component initialization. Server
 * output is `'no-preference'`.
 */
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
