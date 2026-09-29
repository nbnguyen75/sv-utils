import type { HistoryCell } from '../useManualRefHistory/index.svelte.ts';
import type { UseRefHistoryOptions, UseRefHistoryReturn } from '../useRefHistory/index.svelte.ts';

import { useRefHistory } from '../useRefHistory/index.svelte.ts';

/** Options for {@link useThrottledRefHistory}. */
export interface UseThrottledRefHistoryOptions<Raw, Serialized = Raw> extends Omit<
	UseRefHistoryOptions<Raw, Serialized>,
	'throttle'
> {
	/**
	 * Minimum milliseconds between commits.
	 * @default 200
	 */
	throttle?: number;
}

/**
 * Track a cell's history, committing at most once per window.
 *
 * @param source Writable cell to track.
 * @param options History options plus the `throttle` window.
 * @example
 * ```ts
 * const history = useThrottledRefHistory(position, { throttle: 250 });
 * ```
 */
export function useThrottledRefHistory<Raw, Serialized = Raw>(
	source: HistoryCell<Raw>,
	options: UseThrottledRefHistoryOptions<Raw, Serialized> = {}
): UseRefHistoryReturn<Raw, Serialized> {
	const { throttle = 200, ...rest } = options;
	return useRefHistory(source, { ...rest, throttle });
}
