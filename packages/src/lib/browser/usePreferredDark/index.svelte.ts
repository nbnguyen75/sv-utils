import type { UseMediaQueryReturn } from '../useMediaQuery/index.svelte.ts';

import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';

/**
 * Track whether the OS prefers dark colors.
 * @example
 * ```ts
 * const dark = usePreferredDark();
 * dark.value; // OS dark preference
 * ```
 */
export function usePreferredDark(): UseMediaQueryReturn {
	return useMediaQuery('(prefers-color-scheme: dark)');
}
