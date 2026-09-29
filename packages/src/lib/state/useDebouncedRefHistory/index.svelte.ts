import type { HistoryCell } from '../useManualRefHistory/index.svelte.ts';
import type { UseRefHistoryOptions, UseRefHistoryReturn } from '../useRefHistory/index.svelte.ts';

import { useRefHistory } from '../useRefHistory/index.svelte.ts';

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
 * @example
 * ```ts
 * const history = useDebouncedRefHistory(editor, { debounce: 500 });
 * history.undo(); // back before the burst
 * ```
 */
export function useDebouncedRefHistory<Raw, Serialized = Raw>(
	source: HistoryCell<Raw>,
	options: UseDebouncedRefHistoryOptions<Raw, Serialized> = {}
): UseRefHistoryReturn<Raw, Serialized> {
	const { debounce = 200, ...rest } = options;
	return useRefHistory(source, { ...rest, debounce });
}
