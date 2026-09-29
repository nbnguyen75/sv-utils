import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';
import { isBrowser } from '../../shared/is.ts';

/** String serializer for storage values. */
export type UseStorageSerializer<T> = {
	/** Encode a value for storage. */
	write: (value: T) => string;
	/** Decode a stored string; must never throw (fall back to a default). */
	read: (raw: string) => T;
};

/** Reactive storage cell returned by `useLocalStorage` / `useSessionStorage`. */
export interface UseStorageReturn<T> {
	/** Current value; assigning persists write-through. Getter/setter-backed (destructure-safe). */
	value: T;
}

function createDefaultSerializer<T>(): UseStorageSerializer<T> {
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

function useStorage<T>(
	key: string,
	defaultValue: T,
	getStorage: () => Storage,
	serializer: UseStorageSerializer<T> = createDefaultSerializer<T>()
): UseStorageReturn<T> {
	const read = (): T => {
		if (!isBrowser) return defaultValue;
		let raw: string | null;
		try {
			raw = getStorage().getItem(key);
		} catch {
			return defaultValue;
		}
		if (raw === null) return defaultValue;
		try {
			return serializer.read(raw);
		} catch {
			return defaultValue;
		}
	};

	let value = $state<T>(read());

	$effect(() => {
		if (!isBrowser) return;
		try {
			getStorage().setItem(key, serializer.write(value));
		} catch {
			// Storage unavailable or full: keep the in-memory value.
		}
	});

	if (isBrowser) {
		useEventListener(
			() => window,
			'storage',
			(e: StorageEvent) => {
				if (e.key === key && e.newValue !== null) {
					value = serializer.read(e.newValue);
				}
			}
		);
	}

	return {
		get value() {
			return value;
		},
		set value(v: T) {
			value = v;
		}
	};
}

/**
 * Reactive `localStorage`-backed cell. SSR returns `defaultValue` untouched.
 *
 * @param key Storage key.
 * @param defaultValue Value used when the key is absent, unreadable, or during SSR.
 * @param serializer Custom codec (default: JSON with string passthrough).
 * @example
 * ```ts
 * const theme = useLocalStorage('theme', 'light');
 * theme.value = 'dark'; // persists write-through
 * ```
 */
export function useLocalStorage<T>(
	key: string,
	defaultValue: T,
	serializer?: UseStorageSerializer<T>
): UseStorageReturn<T> {
	return useStorage(key, defaultValue, () => localStorage, serializer);
}

/**
 * Reactive `sessionStorage`-backed cell. SSR returns `defaultValue` untouched.
 *
 * @param key Storage key.
 * @param defaultValue Value used when the key is absent, unreadable, or during SSR.
 * @param serializer Custom codec (default: JSON with string passthrough).
 * @example
 * ```ts
 * const draft = useSessionStorage('draft', '');
 * draft.value = 'hello'; // tab-scoped
 * ```
 */
export function useSessionStorage<T>(
	key: string,
	defaultValue: T,
	serializer?: UseStorageSerializer<T>
): UseStorageReturn<T> {
	return useStorage(key, defaultValue, () => sessionStorage, serializer);
}
