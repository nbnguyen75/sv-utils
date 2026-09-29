import { untrack } from 'svelte';

import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';
import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Promise-based key/value backend. */
export interface AsyncStorageLike {
	/** Read a raw string (or `null` when absent). */
	getItem(key: string): Promise<string | null> | string | null;
	/** Persist a raw string. */
	setItem(key: string, value: string): Promise<void> | void;
	/** Delete a key. */
	removeItem(key: string): Promise<void> | void;
}

/** Async string serializer. */
export interface UseStorageAsyncSerializer<T> {
	/** Encode a value for storage (may be async). */
	write(value: T): string | Promise<string>;
	/** Decode a stored string (may be async). */
	read(raw: string): T | Promise<T>;
}

/** Options for {@link useStorageAsync}. */
export interface UseStorageAsyncOptions<T> {
	/**
	 * Custom codec (default: JSON with string passthrough).
	 */
	serializer?: UseStorageAsyncSerializer<T>;
	/**
	 * Write the default back when the key is absent.
	 * @default true
	 */
	writeDefaults?: boolean;
	/**
	 * Re-read on cross-tab `storage` events.
	 * @default true
	 */
	listenToStorageChanges?: boolean;
	/** Called with storage or codec failures. Defaults to `console.error`. */
	onError?: (error: unknown) => void;
	/** Called once with the value after the first read. */
	onReady?: (value: T) => void;
}

/** Async storage cell returned by {@link useStorageAsync}. Awaitable for first-read readiness. */
export interface UseStorageAsyncReturn<T> extends PromiseLike<UseStorageAsyncView<T>> {
	/** Current value; assigning persists write-through (`null`/`undefined` removes the key). */
	value: T;
}

/**
 * Settled view the cell resolves to when awaited. A fresh object per
 * settlement — deliberately `then`-free, because a thenable resolving to
 * itself can never settle.
 */
export interface UseStorageAsyncView<T> {
	/** Current value at settle time. Getter-backed. */
	readonly value: T;
}

function defaultSerializer<T>(): UseStorageAsyncSerializer<T> {
	return {
		read: (raw: string) => {
			try {
				return JSON.parse(raw) as T;
			} catch {
				return raw as unknown as T;
			}
		},
		write: (value: T) => (typeof value === 'string' ? value : JSON.stringify(value))
	};
}

/**
 * Reactive async-storage cell.
 *
 * @param key Storage key.
 * @param initialValue Fallback used until the first read settles (and on
 *   read failures), or a getter resolving to one.
 * @param storage Backend; defaults to `localStorage` in browsers.
 * @param options Codec, write-defaults, cross-tab sync, and hooks.
 * @example
 * ```ts
 * const settings = useStorageAsync('settings', defaults, idbBackend);
 * await settings; // first read settled
 * ```
 */
export function useStorageAsync<T>(
	key: string,
	initialValue: MaybeGetter<T>,
	storage?: AsyncStorageLike | null,
	options: UseStorageAsyncOptions<T> = {}
): UseStorageAsyncReturn<T> {
	const {
		serializer = defaultSerializer<T>(),
		writeDefaults = true,
		listenToStorageChanges = true,
		onError = (error: unknown) => console.error(error),
		onReady
	} = options;

	const backend = storage ?? (isBrowser ? localStorage : undefined);
	const fallback = resolveGetter(initialValue);

	let value = $state<T>(fallback);

	async function read(event?: StorageEvent) {
		if (!backend || (event && event.key !== key)) return;
		try {
			const raw = await backend.getItem(key);
			if (raw == null) {
				value = fallback;
				if (writeDefaults && fallback !== null && fallback !== undefined) {
					await backend.setItem(key, await serializer.write(fallback));
				}
			} else {
				value = await serializer.read(raw);
			}
		} catch (error) {
			onError(error);
		}
	}

	const ready: Promise<UseStorageAsyncView<T>> = read().then(() => {
		onReady?.(value);
		return {
			get value() {
				return value;
			}
		};
	});

	$effect(() => {
		const snapshot = value;
		untrack(() => {
			if (!backend) return;
			Promise.resolve()
				.then(() => serializer.write(snapshot))
				.then(async (raw) => {
					if (snapshot === null || snapshot === undefined) await backend.removeItem(key);
					else await backend.setItem(key, raw);
				})
				.catch((error: unknown) => onError(error));
		});
	});

	if (isBrowser && listenToStorageChanges) {
		useEventListener(
			() => window,
			'storage',
			(event: StorageEvent) => {
				void read(event);
			}
		);
	}

	const cell: UseStorageAsyncReturn<T> = {
		get value() {
			return value;
		},
		set value(next: T) {
			value = next;
		},
		then(onFulfilled, onRejected) {
			return ready.then(onFulfilled, onRejected);
		}
	};

	return cell;
}
