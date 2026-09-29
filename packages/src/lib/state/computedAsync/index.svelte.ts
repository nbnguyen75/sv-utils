/** Register a callback for superseded evaluations. */
export type AsyncComputedOnCancel = (cancel: () => void) => void;

/** Options for {@link computedAsync}. */
export interface AsyncComputedOptions {
	/** Called with the rejection reason on failure. Defaults to a safe reporter. */
	onError?: (error: unknown) => void;
}

/** Async derivation returned by {@link computedAsync}. */
export interface AsyncComputedReturn<T> {
	/** Whether an evaluation is in flight. Getter-backed. */
	readonly evaluating: boolean;
	/** Latest settled value (or the initial state). Getter-backed. */
	readonly value: T;
}

function defaultOnError(error: unknown) {
	if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
}

/**
 * Async derivation with overlap guards and cancellation hooks.
 * @example
 * ```ts
 * const profile = computedAsync(() => fetchProfile(userId()), null);
 * profile.value; // latest settled (or initial)
 * ```
 */

export function computedAsync<T>(
	evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
	initialState: T,
	options?: AsyncComputedOptions
): AsyncComputedReturn<T>;
export function computedAsync<T>(
	evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
	initialState?: undefined,
	options?: AsyncComputedOptions
): AsyncComputedReturn<T | undefined>;
export function computedAsync<T>(
	evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
	initialState?: T,
	options: AsyncComputedOptions = {}
): AsyncComputedReturn<T | undefined> {
	const { onError = defaultOnError } = options;

	let value = $state<T | undefined>(initialState);
	let evaluating = $state(false);
	let generation = 0;

	$effect(() => {
		generation += 1;
		const id = generation;
		let finished = false;
		let cancel: (() => void) | undefined;

		evaluating = true;
		let result: T | Promise<T>;
		try {
			result = evaluationCallback((callback) => {
				cancel = callback;
			});
		} catch (error) {
			if (id === generation) evaluating = false;
			onError(error);
			return;
		}

		Promise.resolve(result).then(
			(data) => {
				finished = true;
				if (id === generation) {
					value = data;
					evaluating = false;
				}
			},
			(error) => {
				finished = true;
				if (id === generation) evaluating = false;
				onError(error);
			}
		);

		return () => {
			if (!finished) cancel?.();
		};
	});

	return {
		get value() {
			return value;
		},
		get evaluating() {
			return evaluating;
		}
	};
}
