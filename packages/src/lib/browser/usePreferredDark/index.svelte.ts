/**
 * Reactive OS dark-theme preference.
 *
 * Inspired by [VueUse `usePreferredDark`](https://vueuse.org/core/usePreferredDark/).
 * Thin wrapper over {@link useMediaQuery} for
 * `(prefers-color-scheme: dark)`. Must be called in component
 * initialization. Server output is `false`.
 */
import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';
import type { UseMediaQueryReturn } from '../useMediaQuery/index.svelte.ts';

/**
 * Track whether the OS prefers dark colors.
 */
export function usePreferredDark(): UseMediaQueryReturn {
	return useMediaQuery('(prefers-color-scheme: dark)');
}
