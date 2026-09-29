/**
 * Manually triggerable watcher with silence controls.
 *
 * Inspired by [VueUse `watchTriggerable`](https://vueuse.org/shared/watchTriggerable/).
 * Composes {@link watchIgnorable}: `trigger()` runs the callback immediately
 * with the current value (old value unknown) without scheduling a duplicate
 * notification. Must be called in component initialization. Disposal on
 * unmount is automatic.
 */
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { watchIgnorable } from '../watchIgnorable/index.svelte.ts';
import type { WatchIgnorableReturn } from '../watchIgnorable/index.svelte.ts';

/** Callback for {@link watchTriggerable}. */
export type WatchTriggerableCallback<T, R = void> = (
	value: T,
	oldValue: T | undefined,
	onCleanup: (cleanup: () => void) => void
) => R;

/** Options for {@link watchTriggerable}. */
export interface WatchTriggerableOptions {
	/**
	 * Fire on mount with `oldValue` undefined.
	 * @default false
	 */
	immediate?: boolean;
}

/** Controls returned by {@link watchTriggerable}. */
export interface WatchTriggerableReturn<R = void> extends WatchIgnorableReturn {
	/** Run the callback now with the current value; returns its result. */
	trigger(): R;
}

/**
 * Watch `source`, with manual triggering on top of silence controls.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param cb Invoked per observed change (or `trigger()`) with
 *   `(value, oldValue, onCleanup)`; its return flows out of `trigger()`.
 * @param options `immediate` mount behavior.
 */
export function watchTriggerable<T, R = void>(
	source: MaybeGetter<T>,
	cb: WatchTriggerableCallback<T, R>,
	options: WatchTriggerableOptions = {}
): WatchTriggerableReturn<R> {
	let cleanup: (() => void) | undefined;

	function onCleanup(fn: () => void) {
		cleanup = fn;
	}

	function runCleanup() {
		const fn = cleanup;
		cleanup = undefined;
		fn?.();
	}

	function wrapped(value: T, oldValue: T | undefined): R {
		runCleanup();
		return cb(value, oldValue, onCleanup);
	}

	const {
		stop: stopWatch,
		ignoreUpdates,
		ignorePrevAsyncUpdates
	} = watchIgnorable(source, wrapped, options);

	function stop() {
		runCleanup();
		stopWatch();
	}

	function trigger(): R {
		let result: R | undefined;
		ignoreUpdates(() => {
			result = wrapped(resolveGetter(source), undefined);
		});
		return result as R;
	}

	return { stop, ignoreUpdates, ignorePrevAsyncUpdates, trigger };
}
