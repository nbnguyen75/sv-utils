/**
 * Auto-tracked history with debounced commits.
 *
 * Inspired by [VueUse `useDebouncedRefHistory`](https://vueuse.org/core/useDebouncedRefHistory/).
 * Shorthand for {@link useRefHistory} with a `debounce` window: rapid
 * changes coalesce into one commit after the burst goes quiet. Must be
 * called in component initialization.
 */
import { useRefHistory } from '../useRefHistory/index.svelte.ts';
import type { UseRefHistoryOptions, UseRefHistoryReturn } from '../useRefHistory/index.svelte.ts';
import type { HistoryCell } from '../useManualRefHistory/index.svelte.ts';

/** Options for {@link useDebouncedRefHistory}. */
export interface UseDebouncedRefHistoryOptions<Raw, Serialized = Raw> extends Omit<
	UseRefHistoryOptions<Raw, Serialized>,
	'debounce'
> {
	/**
	 * Quiet milliseconds before a burst commits.
	 * @default 200
	 */
	debounce?: number;
}

/**
 * Track a cell's history, committing debounced bursts.
 *
 * @param source Writable cell to track.
 * @param options History options plus the `debounce` window.
 */
export function useDebouncedRefHistory<Raw, Serialized = Raw>(
	source: HistoryCell<Raw>,
	options: UseDebouncedRefHistoryOptions<Raw, Serialized> = {}
): UseRefHistoryReturn<Raw, Serialized> {
	const { debounce = 200, ...rest } = options;
	return useRefHistory(source, { ...rest, debounce });
}
