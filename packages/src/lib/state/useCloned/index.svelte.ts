import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';

/** Options for {@link useCloned}. */
export interface UseClonedOptions<T> {
	/**
	 * Custom clone function.
	 * @default structuredClone
	 */
	clone?: (source: T) => T;
	/**
	 * Only sync via `sync()`; ignore source changes.
	 * @default false
	 */
	manual?: boolean;
}

/** Cloned state returned by {@link useCloned}. */
export interface UseClonedReturn<T> {
	/** Whether the clone was edited since the last sync. Getter-backed. */
	readonly isModified: boolean;
	/** Re-clone from the source and clear `isModified`. */
	sync(): void;
	/** Editable clone of the source. Getter/setter-backed (destructure-safe). */
	value: T;
}

/**
 * Clone `source` into independently editable state.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param options `clone` implementation and `manual` sync mode.
 * @example
 * ```ts
 * const form = useCloned(() => original);
 * form.value.name = 'edited';
 * form.isModified; // true
 * form.sync(); // discard edits
 * ```
 */
export function useCloned<T>(
	source: MaybeGetter<T>,
	options: UseClonedOptions<T> = {}
): UseClonedReturn<T> {
	const { clone = structuredClone, manual = false } = options;

	let cloned = $state<T>(clone($state.snapshot(resolveGetter(source)) as T));
	let isModified = $state(false);
	let suppressDirty = false;
	let pristine = true;

	function sync(): void {
		suppressDirty = true;
		isModified = false;
		cloned = clone($state.snapshot(resolveGetter(source)) as T);
	}

	if (!manual) {
		let firstSourceRun = true;
		$effect(() => {
			// Deep snapshot so nested source edits re-run this effect.
			$state.snapshot(resolveGetter(source));
			untrack(() => {
				// The clone is already synced at setup; every later run
				// is a genuine source change.
				if (firstSourceRun) {
					firstSourceRun = false;
					return;
				}
				sync();
			});
		});
	}

	$effect(() => {
		// Deep-read the clone so every nested edit re-runs this effect.
		$state.snapshot(cloned);
		untrack(() => {
			if (pristine) {
				pristine = false;
				return;
			}
			if (suppressDirty) {
				suppressDirty = false;
				return;
			}
			isModified = true;
		});
	});

	return {
		get value() {
			return cloned;
		},
		set value(next: T) {
			cloned = next;
		},
		get isModified() {
			return isModified;
		},
		sync
	};
}
