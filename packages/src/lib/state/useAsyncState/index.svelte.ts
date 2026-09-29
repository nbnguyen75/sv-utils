import type { MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Options for {@link useAsyncState}. */
export interface UseAsyncStateOptions<D> {
	/** Called with the rejection reason on failure. Defaults to a safe reporter. */
	onError?: (error: unknown) => void;
	/** Called with the data on success (including stale executions). */
	onSuccess?: (data: D) => void;
	/**
	 * Reset state to the initial value before each execution.
	 * @default true
	 */
	resetOnExecute?: boolean;
	/**
	 * Re-throw failures from `execute` instead of resolving `undefined`.
	 * @default false
	 */
	throwError?: boolean;
	/**
	 * Run on creation (after `delay` when set).
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Delay before the immediate execution, in milliseconds.
	 * @default 0
	 */
	delay?: number;
}

/** Async state returned by {@link useAsyncState}. Awaitable until loaded. */
export interface UseAsyncStateReturn<D, Args extends unknown[]> extends PromiseLike<
	UseAsyncStateSnapshot<D, Args>
> {
	/** Run (optionally delayed); only the latest execution settles state. */
	execute(delay?: number, ...args: Args): Promise<D | undefined>;
	/** Run immediately with arguments. */
	executeImmediate(...args: Args): Promise<D | undefined>;
	/** Whether an execution is in flight. Getter-backed. */
	readonly isLoading: boolean;
	/** Whether at least one execution has settled. Getter-backed. */
	readonly isReady: boolean;
	/** Latest failure of the current execution generation. Getter-backed. */
	readonly error: unknown;
	/** Latest settled data (or the initial value). Getter-backed. */
	readonly state: D;
}

/**
 * Settled view the shell resolves to when awaited. A fresh object per
 * settlement with live getters — deliberately `then`-free, because a
 * thenable resolving to itself can never settle.
 */
export interface UseAsyncStateSnapshot<D, Args extends unknown[]> {
	/** Run (optionally delayed); only the latest execution settles state. */
	execute(delay?: number, ...args: Args): Promise<D | undefined>;
	/** Run immediately with arguments. */
	executeImmediate(...args: Args): Promise<D | undefined>;
	/** Whether an execution is in flight. Getter-backed. */
	readonly isLoading: boolean;
	/** Whether at least one execution has settled. Getter-backed. */
	readonly isReady: boolean;
	/** Latest failure of the current execution generation. Getter-backed. */
	readonly error: unknown;
	/** Latest settled data (or the initial value). Getter-backed. */
	readonly state: D;
}

function defaultOnError(error: unknown) {
	if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
}

function delayBy(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Track a promise (or promise factory) as reactive state.
 *
 * @param promise A promise, or a factory receiving `execute` arguments.
 * @param initialState Value held until the first execution settles.
 * @param options Lifecycle flags and callbacks.
 * @example
 * ```ts
 * const user = useAsyncState((id: number) => fetchUser(id), null, {
 * 	immediate: false
 * });
 * await user.executeImmediate(7);
 * ```
 */
export function useAsyncState<D, Args extends unknown[] = []>(
	promise: Promise<D> | ((...args: Args) => Promise<D>),
	initialState: MaybeGetter<D>,
	options: UseAsyncStateOptions<D> = {}
): UseAsyncStateReturn<D, Args> {
	const {
		immediate = true,
		delay = 0,
		onError = defaultOnError,
		onSuccess = () => {},
		resetOnExecute = true,
		throwError = false
	} = options;

	const initial = resolveGetter(initialState);
	// Always deep `$state` (lazily proxied, so large payloads stay cheap);
	// VueUse's `shallow` option has no equivalent need here.
	let state = $state<D>(initial);
	let isReady = $state(false);
	let isLoading = $state(false);
	let error = $state<unknown>(undefined);
	let executions = 0;
	let current: Promise<D | undefined> | undefined;
	const NO_ARGS = [] as unknown as Args;

	async function execute(executeDelay = 0, ...args: Args): Promise<D | undefined> {
		const id = (executions += 1);

		if (resetOnExecute) state = initial;
		error = undefined;
		isReady = false;
		isLoading = true;

		if (executeDelay > 0) await delayBy(executeDelay);

		const pending = typeof promise === 'function' ? promise(...args) : promise;

		try {
			const data = await pending;
			if (id === executions) {
				state = data;
				isReady = true;
			}
			onSuccess(data);
			return data;
		} catch (failure) {
			if (id === executions) error = failure;
			onError(failure);
			if (throwError) throw failure;
			return undefined;
		} finally {
			if (id === executions) isLoading = false;
		}
	}

	if (immediate) {
		current = execute(delay, ...NO_ARGS);
		current.catch(() => {});
	}

	function run(executeDelay = 0, ...args: Args): Promise<D | undefined> {
		current = execute(executeDelay, ...args);
		current.catch(() => {});
		return current;
	}

	function snapshot(): UseAsyncStateSnapshot<D, Args> {
		return {
			get state() {
				return state;
			},
			get isReady() {
				return isReady;
			},
			get isLoading() {
				return isLoading;
			},
			get error() {
				return error;
			},
			execute: run,
			executeImmediate: (...args: Args) => run(0, ...args)
		};
	}

	const shell: UseAsyncStateReturn<D, Args> = {
		get state() {
			return state;
		},
		get isReady() {
			return isReady;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		execute: run,
		executeImmediate: (...args: Args) => run(0, ...args),
		then(onFulfilled, onRejected) {
			return (current ?? Promise.resolve())
				.then(
					() => snapshot(),
					() => snapshot()
				)
				.then(onFulfilled, onRejected);
		}
	};

	return shell;
}
