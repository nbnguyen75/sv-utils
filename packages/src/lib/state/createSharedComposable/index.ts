/**
 * Shared singleton composable: one instance while mounted anywhere.
 *
 * Inspired by [VueUse `createSharedComposable`](https://vueuse.org/shared/createSharedComposable/).
 * On the server every call builds a fresh instance (never share state
 * across SSR requests). On the client the first call builds the instance
 * and later calls reuse it.
 *
 * Svelte divergence: Vue's subscriber ref-counting has no equivalent here
 * (no effect scopes), so the client instance lives for the app lifetime
 * instead of disposing with the last subscriber. Reserve this for truly
 * shared state (theme, mouse, auth session).
 */
import { isBrowser } from '../../shared/is.ts';

/**
 * Share one composable instance across callers.
 *
 * @param composable Factory whose first client-side result is reused.
 * @returns A function returning the shared (or fresh, on SSR) instance.
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
