import { isBrowser } from '../../shared/is.ts';

/**
 * Share one composable instance across callers.
 *
 * @param composable Factory whose first client-side result is reused.
 * @returns A function returning the shared (or fresh, on SSR) instance.
 * @example
 * ```ts
 * const useSharedMouse = createSharedComposable(() => useMouse());
 * useSharedMouse(); // one instance on the client
 * ```
 */
export function createSharedComposable<Args extends unknown[], R>(
	composable: (...args: Args) => R
): (...args: Args) => R {
	if (!isBrowser) return composable;

	let state: R | undefined;

	return (...args: Args): R => {
		if (state === undefined) state = composable(...args);
		return state;
	};
}
