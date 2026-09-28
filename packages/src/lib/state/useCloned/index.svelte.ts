/**
 * Editable deep clone of a reactive source with a dirty flag.
 *
 * Inspired by [VueUse `useCloned`](https://vueuse.org/core/useCloned/).
 * Source changes re-sync the clone (unless `manual`), and edits to the
 * clone raise `isModified`. Both observations run inside `$effect`, so this
 * must be called in component initialization; bookkeeping is `untrack`ed.
 */
import { untrack } from 'svelte';

import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

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
	/** Editable clone of the source. Getter/setter-backed (destructure-safe). */
	value: T;
	/** Whether the clone was edited since the last sync. Getter-backed. */
	readonly isModified: boolean;
	/** Re-clone from the source and clear `isModified`. */
	sync(): void;
}

/**
 * Clone `source` into independently editable state.
 *
 * @param source Reactive source: a value or a getter over reactive state.
 * @param options `clone` implementation and `manual` sync mode.
 */
export function useCloned<T>(
	source: MaybeGetter<T>,
	options: UseClonedOptions<T> = {}
): UseClonedReturn<T> {
	const { clone = structuredClone, manual = false } = options;

	let cloned = $state<T>(clone($state.snapshot(resolve(source)) as T));
	let isModified = $state(false);
	let suppressDirty = false;
	let pristine = true;

	function sync(): void {
		suppressDirty = true;
		isModified = false;
		cloned = clone($state.snapshot(resolve(source)) as T);
	}

	if (!manual) {
		let firstSourceRun = true;
		$effect(() => {
			// Deep snapshot so nested source edits re-run this effect.
			$state.snapshot(resolve(source));
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
