/**
 * Application-wide singleton state from a factory.
 *
 * Inspired by [VueUse `createGlobalState`](https://vueuse.org/shared/createGlobalState/).
 * The factory runs lazily on first call; every later call (anywhere in the
 * app) receives the same instance. Framework-free — safe to call anywhere,
 * including during SSR (note: module singletons are shared across SSR
 * requests, same caveat as upstream).
 *
 * @param stateFactory Builds the state on first use.
 * @returns The memoized factory.
 */
export function createGlobalState<Args extends unknown[], R>(
	stateFactory: (...args: Args) => R
): (...args: Args) => R {
	let initialized = false;
	let state: R | undefined;

	return (...args: Args): R => {
		if (!initialized) {
			state = stateFactory(...args);
			initialized = true;
		}
		return state as R;
	};
}
