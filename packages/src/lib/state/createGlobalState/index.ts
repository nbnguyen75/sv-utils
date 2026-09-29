/**
 * Application-wide singleton state from a factory.
 * @example
 * ```ts
 * const useStore = createGlobalState(() => ({ count: 0 }));
 * useStore(); // same instance everywhere
 * ```
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
