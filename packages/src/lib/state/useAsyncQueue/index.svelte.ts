/**
 * Sequential async task queue with per-task state, interruption,
 * and abort support.
 *
 * Inspired by [VueUse `useAsyncQueue`](https://vueuse.org/core/useAsyncQueue/).
 * Tasks run chained on creation (each receives the previous result).
 * Framework-free — safe to call anywhere, including during SSR
 * (no DOM access, no effects).
 */

export type UseAsyncQueueTask<T> = (previousResult: never) => T | Promise<T>;

/** Per-task outcome. */
export interface UseAsyncQueueResult<T> {
	state: 'aborted' | 'fulfilled' | 'pending' | 'rejected';
	data: T | null;
}

/** Queue state returned by {@link useAsyncQueue}. */
export interface UseAsyncQueueReturn<T extends unknown[]> {
	/** Index of the task currently (or last) running. Getter-backed. */
	readonly activeIndex: number;
	/** Per-task outcomes in order. Getter-backed. */
	readonly result: { [P in keyof T]: UseAsyncQueueResult<T[P]> };
}

/** Options for {@link useAsyncQueue}. */
export interface UseAsyncQueueOptions {
	/**
	 * Stop the chain when a task rejects (remaining tasks stay pending).
	 * @default true
	 */
	interrupt?: boolean;
	/** Called when a task rejects. */
	onError?: () => void;
	/** Called when the queue settles (all done, interrupted, or aborted). */
	onFinished?: () => void;
	/** AbortSignal that aborts the queue. */
	signal?: AbortSignal;
}

function whenAborted(signal: AbortSignal): Promise<never> {
	return new Promise((_resolve, reject) => {
		const error = new Error('aborted');
		if (signal.aborted) reject(error);
		else signal.addEventListener('abort', () => reject(error), { once: true });
	});
}

/**
 * Run promise tasks strictly in sequence.
 *
 * @param tasks Task functions receiving the previous task's result.
 * @param options `interrupt`, `onError`/`onFinished` hooks, `signal`.
 */
export function useAsyncQueue<T extends unknown[]>(
	tasks: { [K in keyof T]: UseAsyncQueueTask<T[K]> },
	options: UseAsyncQueueOptions = {}
): UseAsyncQueueReturn<T> {
	const { interrupt = true, onError = () => {}, onFinished = () => {}, signal } = options;

	type Outcome = UseAsyncQueueResult<unknown>;
	const initial: Outcome[] = Array.from({ length: tasks.length }, () => ({
		state: 'pending',
		data: null
	}));

	const result = $state(initial) as { [P in keyof T]: UseAsyncQueueResult<T[P]> };
	let activeIndex = $state(-1);

	if (!tasks || tasks.length === 0) {
		onFinished();
		return {
			get activeIndex() {
				return activeIndex;
			},
			get result() {
				return result;
			}
		};
	}

	function update(state: Outcome['state'], data: unknown) {
		activeIndex += 1;
		const slot = result[activeIndex] as Outcome | undefined;
		if (slot) {
			slot.data = data;
			slot.state = state;
		}
	}

	function settled(resultState: Outcome['state'], data: unknown, failed: boolean) {
		update(resultState, data);
		if (failed) onError();
		if (activeIndex === tasks.length - 1) onFinished();
		return data;
	}

	tasks.reduce<Promise<unknown>>(
		(previous, current) =>
			previous
				.then((previousResult) => {
					if (signal?.aborted) {
						settled('aborted', new Error('aborted'), false);
						return previousResult;
					}
					const latest = result[activeIndex] as Outcome | undefined;
					if (latest?.state === 'rejected' && interrupt) {
						onFinished();
						return previousResult;
					}
					const done = Promise.resolve()
						.then(() => current(previousResult as never))
						.then((currentResult) => {
							settled('fulfilled', currentResult, false);
							return currentResult;
						});
					if (!signal) return done;
					return Promise.race([done, whenAborted(signal)]);
				})
				.catch((error: unknown) => {
					if (signal?.aborted) {
						settled('aborted', error, false);
						return error;
					}
					settled('rejected', error, true);
					return error;
				}),
		Promise.resolve()
	);

	return {
		get activeIndex() {
			return activeIndex;
		},
		get result() {
			return result;
		}
	};
}
