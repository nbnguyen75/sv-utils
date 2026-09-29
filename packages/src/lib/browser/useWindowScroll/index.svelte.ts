import type { UseScrollOptions, UseScrollReturn } from '../useScroll/index.svelte.ts';

import { isBrowser } from '../../shared/is.ts';
import { useScroll } from '../useScroll/index.svelte.ts';

/** Options for {@link useWindowScroll} (same as `useScroll`). */
export type UseWindowScrollOptions = UseScrollOptions;

/** State returned by {@link useWindowScroll} (same as `useScroll`). */
export type UseWindowScrollReturn = UseScrollReturn;

/**
 * Track window scroll position.
 *
 * @param options Same options as `useScroll`.
 * @example
 * ```ts
 * const { x, y } = useWindowScroll();
 * y; // window scrollY
 * ```
 */
export function useWindowScroll(options: UseWindowScrollOptions = {}): UseWindowScrollReturn {
	return useScroll(() => (isBrowser ? window : undefined), options);
}
