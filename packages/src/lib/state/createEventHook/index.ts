/** Subscriber for an {@link EventHook}. */
export type EventHookCallback<T> = [T] extends [void] ? () => unknown : (data: T) => unknown;

/** Event hub returned by {@link createEventHook}. */
export interface EventHook<T> {
	/** Subscribe; the returned `off` unsubscribes. */
	on(fn: EventHookCallback<T>): { off(): void };
	/** Unsubscribe `fn`. */
	off(fn: EventHookCallback<T>): void;
	/** Notify all subscribers; resolves with every result. */
	trigger(...args: [T] extends [void] ? [] : [data: T]): Promise<unknown[]>;
	/** Remove all subscribers. */
	clear(): void;
}

/**
 * Create an event hook: `on`/`off`/`trigger`/`clear` over a subscriber set.
 * @example
 * ```ts
 * const hook = createEventHook<string>();
 * hook.on((data) => console.log(data));
 * await hook.trigger('go');
 * ```
 */
export function createEventHook<T = void>(): EventHook<T> {
	const fns = new Set<EventHookCallback<T>>();

	function off(fn: EventHookCallback<T>) {
		fns.delete(fn);
	}

	function clear() {
		fns.clear();
	}

	function on(fn: EventHookCallback<T>) {
		fns.add(fn);
		return {
			off() {
				off(fn);
			}
		};
	}

	function trigger(...args: [T] extends [void] ? [] : [data: T]): Promise<unknown[]> {
		return Promise.all(
			Array.from(fns).map((fn) => (fn as (...call: unknown[]) => unknown)(...args))
		);
	}

	return { on, off, trigger, clear };
}
