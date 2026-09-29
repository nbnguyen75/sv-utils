import { untrack } from 'svelte';

/** Options for {@link refWithControl}. */
export interface ControlledRefOptions<T> {
	/**
	 * Runs before a write; return `false` to dismiss it.
	 */
	onBeforeChange?: (value: T, oldValue: T) => void | boolean;
	/**
	 * Runs synchronously after an accepted write (cheaper than a watcher).
	 */
	onChanged?: (value: T, oldValue: T) => void;
}

/** Controlled state returned by {@link refWithControl}. */
export interface RefWithControlReturn<T> {
	/** Current value; writes run the veto + change callbacks. Getter/setter-backed. */
	value: T;
	/** Read, tracking by default. */
	get(tracking?: boolean): T;
	/** Write through the veto + change callbacks. */
	set(value: T): void;
	/** Read without subscribing. */
	untrackedGet(): T;
	/** Read without subscribing (alias). */
	peek(): T;
}

/**
 * Create a controlled state cell.
 *
 * @param initial Starting value.
 * @param options `onBeforeChange` veto and `onChanged` notification.
 * @example
 * ```ts
 * const age = refWithControl(0, {
 * 	onBeforeChange: (value) => (value < 0 ? false : undefined)
 * });
 * age.value = -5; // dismissed, stays 0
 * ```
 */
export function refWithControl<T>(
	initial: T,
	options: ControlledRefOptions<T> = {}
): RefWithControlReturn<T> {
	let source = $state<T>(initial);

	function get(tracking = true): T {
		return tracking ? source : untrack(() => source);
	}

	function set(value: T) {
		if (Object.is(value, source)) return;
		const old = source;
		if (options.onBeforeChange?.(value, old) === false) return;
		source = value;
		options.onChanged?.(value, old);
	}

	function untrackedGet(): T {
		return get(false);
	}

	return {
		get value() {
			return source;
		},
		set value(next: T) {
			set(next);
		},
		get,
		set,
		untrackedGet,
		peek: untrackedGet
	};
}
