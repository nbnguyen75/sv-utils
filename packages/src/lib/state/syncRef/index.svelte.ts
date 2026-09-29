/**
 * Two-way synchronization between state cells, with direction control
 * and value transforms.
 *
 * Inspired by [VueUse `syncRef`](https://vueuse.org/shared/syncRef/).
 * Cells are any getter/setter pair (including every `{ value }` object
 * this library returns). Each direction runs in its own `$effect`, so this
 * must be called in component initialization. Loop-breaking uses a sync
 * window instead of VueUse's mutual pause: a write suppresses the opposite
 * direction until the flush settles, then converges via equality checks.
 * Disposal on unmount is automatic.
 */
import { untrack } from 'svelte';

/** Readable/writable cell shape accepted by {@link syncRef}. */
export interface SyncCell<T> {
	value: T;
}

/** Sync direction. */
export type SyncDirection = 'ltr' | 'rtl' | 'both';

/** Options for {@link syncRef}. */
export interface SyncRefOptions<L, R> {
	/**
	 * Sync directions to install.
	 * @default 'both'
	 */
	direction?: SyncDirection;
	/**
	 * Align the cells on mount.
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Value transforms per direction (identity by default).
	 */
	transform?: {
		ltr?: (left: L) => R;
		rtl?: (right: R) => L;
	};
}

/**
 * Keep two cells in sync.
 *
 * @param left Left cell.
 * @param right Right cell.
 * @param options `direction`, `immediate` alignment, and `transform`s.
 * @returns `stop`: detach both directions permanently.
 */
export function syncRef<L, R>(
	left: SyncCell<L>,
	right: SyncCell<R>,
	options: SyncRefOptions<L, R> = {}
): () => void {
	const { direction = 'both', immediate = true, transform = {} } = options;
	const ltr = transform.ltr ?? ((value: L): R => value as unknown as R);
	const rtl = transform.rtl ?? ((value: R): L => value as unknown as L);

	let stopped = false;
	let syncing = false;
	let firstLtr = !immediate;
	let firstRtl = !immediate;

	function stop() {
		stopped = true;
	}

	if (direction === 'both' || direction === 'ltr') {
		$effect(() => {
			const source = left.value;
			untrack(() => {
				if (stopped || syncing) return;
				if (firstLtr) {
					firstLtr = false;
					if (!immediate) return;
				}
				const converted = ltr(source);
				if (!Object.is(converted, right.value)) {
					syncing = true;
					right.value = converted;
					queueMicrotask(() => {
						syncing = false;
					});
				}
			});
		});
	}

	if (direction === 'both' || direction === 'rtl') {
		$effect(() => {
			const source = right.value;
			untrack(() => {
				if (stopped || syncing) return;
				if (firstRtl) {
					firstRtl = false;
					if (!immediate) return;
				}
				const converted = rtl(source);
				if (!Object.is(converted, left.value)) {
					syncing = true;
					left.value = converted;
					queueMicrotask(() => {
						syncing = false;
					});
				}
			});
		});
	}

	return stop;
}
