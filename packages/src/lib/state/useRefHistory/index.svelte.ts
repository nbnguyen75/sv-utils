/**
 * Auto-tracked change history (undo/redo) for a state cell.
 *
 * Inspired by [VueUse `useRefHistory`](https://vueuse.org/core/useRefHistory/).
 * Source changes commit automatically through {@link watchIgnorable}
 * (silent programmatic writes stay skippable); optional `debounce` /
 * `throttle` windows coalesce rapid commits. Must be called in component
 * initialization. Disposal on unmount is automatic.
 */
import { untrack } from 'svelte';

import { useDebounceFn } from '../../utilities/useDebounceFn/index.ts';
import { useThrottleFn } from '../../utilities/useThrottleFn/index.ts';
import { watchIgnorable } from '../watchIgnorable/index.svelte.ts';
import { useManualRefHistory } from '../useManualRefHistory/index.svelte.ts';
import type {
	HistoryCell,
	UseManualRefHistoryOptions,
	UseManualRefHistoryReturn
} from '../useManualRefHistory/index.svelte.ts';

/** Options for {@link useRefHistory} (and the debounced/throttled shorthands). */
export interface UseRefHistoryOptions<Raw, Serialized = Raw> extends UseManualRefHistoryOptions<
	Raw,
	Serialized
> {
	/**
	 * Track nested mutations (deep snapshot reads).
	 * @default false
	 */
	deep?: boolean;
	/**
	 * Coalesce commits: only commit after this many quiet milliseconds.
	 * Mutually exclusive with `throttle`.
	 */
	debounce?: number;
	/**
	 * Coalesce commits: at most one commit per window in milliseconds.
	 * Mutually exclusive with `throttle`.
	 */
	throttle?: number;
	/**
	 * Veto a commit by comparing the pre-change and current values.
	 */
	shouldCommit?: (oldValue: Raw | undefined, newValue: Raw) => boolean;
}

/** History state returned by {@link useRefHistory}. */
export interface UseRefHistoryReturn<Raw, Serialized> extends UseManualRefHistoryReturn<
	Raw,
	Serialized
> {
	/** Whether change tracking is enabled. Getter-backed. */
	readonly isTracking: boolean;
	/** Suspend automatic commits. */
	pause(): void;
	/**
	 * Resume automatic commits; commit immediately first when `commitNow`.
	 */
	resume(commitNow?: boolean): void;
	/**
	 * Run `fn` with tracking silenced, then commit once unless `cancel()`
	 * was invoked.
	 */
	batch(fn: (cancel: () => void) => void): void;
	/** Stop tracking and drop all records. */
	dispose(): void;
	/** Silence the next automatic commit(s) from programmatic writes. */
	ignoreUpdates(updater: () => void): void;
	/** Drop the currently pending automatic commit, if any. */
	ignorePrevAsyncUpdates(): void;
}

/**
 * Track a cell's history automatically, with undo/redo.
 *
 * @param source Writable cell to track.
 * @param options Capacity, codecs, `deep` tracking, `debounce`/`throttle`
 *   commit windows, and `shouldCommit` vetoes.
 */
export function useRefHistory<Raw, Serialized = Raw>(
	source: HistoryCell<Raw>,
	options: UseRefHistoryOptions<Raw, Serialized> = {}
): UseRefHistoryReturn<Raw, Serialized> {
	const { deep = false, debounce, throttle, shouldCommit = () => true, ...manualOptions } = options;

	let tracking = $state(true);
	let lastRaw: Raw | undefined = source.value;

	const setSourceValue = (value: Raw) => {
		ignorePrevAsyncUpdates();
		ignoreUpdates(() => {
			source.value = value;
			lastRaw = value;
		});
	};

	const manual = useManualRefHistory(source, { ...manualOptions, setSource: setSourceValue });
	const { commit: manualCommit } = manual;

	function commitNow() {
		// No ignorePrevAsyncUpdates() here: unlike Vue's pre/post watchers,
		// committing only touches the stacks (never the tracked source), so
		// a manual commit can never schedule a duplicate notification.
		// Arming the guard here would poison the NEXT genuine change.
		if (!shouldCommit(lastRaw, source.value)) return;
		lastRaw = source.value;
		manualCommit();
	}

	const debouncedCommit =
		debounce === undefined ? undefined : useDebounceFn(() => commitNow(), debounce);
	const throttledCommit =
		throttle === undefined ? undefined : useThrottleFn(() => commitNow(), throttle);

	function scheduleCommit() {
		if (debouncedCommit) debouncedCommit();
		else if (throttledCommit) throttledCommit();
		else commitNow();
	}

	const { ignoreUpdates, ignorePrevAsyncUpdates, stop } = watchIgnorable(
		() => (deep ? $state.snapshot(source.value) : source.value),
		() => {
			untrack(() => {
				if (tracking) scheduleCommit();
			});
		}
	);

	function pause() {
		tracking = false;
	}

	function resume(commitNowFlag = false) {
		tracking = true;
		if (commitNowFlag) commitNow();
	}

	function batch(fn: (cancel: () => void) => void) {
		let canceled = false;
		ignoreUpdates(() => {
			fn(() => {
				canceled = true;
			});
		});
		if (!canceled) commitNow();
	}

	function dispose() {
		stop();
		manual.clear();
	}

	return {
		get source() {
			return manual.source;
		},
		get history() {
			return manual.history;
		},
		get last() {
			return manual.last;
		},
		get undoStack() {
			return manual.undoStack;
		},
		get redoStack() {
			return manual.redoStack;
		},
		get canUndo() {
			return manual.canUndo;
		},
		get canRedo() {
			return manual.canRedo;
		},
		undo: manual.undo,
		redo: manual.redo,
		clear: manual.clear,
		reset: manual.reset,
		get isTracking() {
			return tracking;
		},
		pause,
		resume,
		commit: commitNow,
		batch,
		dispose,
		ignoreUpdates,
		ignorePrevAsyncUpdates
	};
}
