import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import { timestamp } from '../../shared/is.ts';

/** Options for {@link useLastChanged}. */
export interface UseLastChangedOptions {
	/**
	 * Starting value.
	 * @default null
	 */
	initialValue?: number | null;
	/**
	 * Stamp the mount time instead of starting empty.
	 * @default false
	 */
	immediate?: boolean;
}

/** Change-timestamp state returned by {@link useLastChanged}. */
export interface UseLastChangedReturn {
	/**
	 * Epoch milliseconds of the source's last change (`null` until the
	 * first change, unless `immediate` / `initialValue` say otherwise).
	 * Getter-backed (destructure-safe).
	 */
	readonly value: number | null;
}

/**
 * Records when `source` last changed.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param options `immediate` stamp-on-mount and `initialValue` override.
 * @example
 * ```ts
 * const changed = useLastChanged(() => draft);
 * changed.value; // epoch ms of last edit (null until first)
 * ```
 */
export function useLastChanged(
	source: MaybeGetter<unknown>,
	options: UseLastChangedOptions = {}
): UseLastChangedReturn {
	const { immediate = false, initialValue = null } = options;

	let ms = $state<number | null>(immediate ? timestamp() : initialValue);
	let fresh = true;

	$effect(() => {
		resolveGetter(source);
		untrack(() => {
			// Skip the effect's first run on mount (unless `immediate`
			// already stamped above); every later run is a real change.
			if (fresh) {
				fresh = false;
				return;
			}
			ms = timestamp();
		});
	});

	return {
		get value() {
			return ms;
		}
	};
}
