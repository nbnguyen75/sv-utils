import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';
import { isBrowser } from '../../shared/is.ts';

export type Serializer<T> = {
	read: (raw: string) => T;
	write: (value: T) => string;
};

function createDefaultSerializer<T>(): Serializer<T> {
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
	serializer: Serializer<T> = createDefaultSerializer<T>()
) {
	const read = (): T => {
		if (!isBrowser) return defaultValue;
		const raw = getStorage().getItem(key);
		return raw === null ? defaultValue : serializer.read(raw);
	};

	let value = $state<T>(read());

	$effect(() => {
		if (!isBrowser) return;
		getStorage().setItem(key, serializer.write(value));
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

export function useLocalStorage<T>(key: string, defaultValue: T, serializer?: Serializer<T>) {
	return useStorage(key, defaultValue, () => localStorage, serializer);
}

export function useSessionStorage<T>(key: string, defaultValue: T, serializer?: Serializer<T>) {
	return useStorage(key, defaultValue, () => sessionStorage, serializer);
}
