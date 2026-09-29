// @vitest-environment jsdom
/**
 * Tests for `useStorageAsync`: initial reads, write-through, removal,
 * cross-tab sync, failures, serializers, and awaitability.
 */
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useStorageAsync } from './index.ts';
import type { AsyncStorageLike } from './index.ts';

function memoryStorage(initial: Record<string, string> = {}): AsyncStorageLike & {
	store: Map<string, string>;
} {
	const store = new Map<string, string>(Object.entries(initial));
	return {
		store,
		getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
		setItem: (key: string, value: string) => {
			store.set(key, value);
			return Promise.resolve();
		},
		removeItem: (key: string) => {
			store.delete(key);
			return Promise.resolve();
		}
	};
}

beforeEach(() => {
	window.localStorage.clear();
});

// Effect flush plus microtask drain for the async backend chains.
async function settled() {
	await tick();
	for (let i = 0; i < 10; i += 1) await Promise.resolve();
	await tick();
}

describe('useStorageAsync', () => {
	it('reads an existing value on mount and reports readiness', async () => {
		const backend = memoryStorage({ greeting: '"hi"' });
		const onReady = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useStorageAsync('greeting', 'fallback', backend, { onReady })
		);
		try {
			await api;
			expect(api.value).toBe('hi');
			expect(onReady).toHaveBeenCalledWith('hi');
		} finally {
			await dispose();
		}
	});

	it('falls back to the default and writes it back when absent', async () => {
		const backend = memoryStorage();
		const { api, dispose } = await mountUtil(() => useStorageAsync('missing', 'dflt', backend));
		try {
			await api;
			expect(api.value).toBe('dflt');
			await tick();
			expect(backend.store.get('missing')).toBe('dflt');
		} finally {
			await dispose();
		}
	});

	it('persists assignments write-through', async () => {
		const backend = memoryStorage({ n: '1' });
		const { api, dispose } = await mountUtil(() => useStorageAsync('n', 0, backend));
		try {
			await api;
			api.value = 41;
			await settled();
			expect(backend.store.get('n')).toBe('41');
		} finally {
			await dispose();
		}
	});

	it('removes the key on nullish assignment', async () => {
		const backend = memoryStorage({ gone: '"here"' });
		const { api, dispose } = await mountUtil(() =>
			useStorageAsync<string | null>('gone', null, backend)
		);
		try {
			await api;
			expect(api.value).toBe('here');
			api.value = null;
			await settled();
			expect(backend.store.has('gone')).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('re-reads on cross-tab storage events', async () => {
		const backend = memoryStorage({ shared: '"one"' });
		const { api, dispose } = await mountUtil(() => useStorageAsync('shared', 'zero', backend));
		try {
			await api;
			backend.store.set('shared', '"two"');
			window.dispatchEvent(new StorageEvent('storage', { key: 'shared' }));
			await settled();
			// The mock backend ignores the event payload and re-reads state.
			expect(api.value).toBe('two');
		} finally {
			await dispose();
		}
	});

	it('keeps defaults and reports failures on backend errors', async () => {
		const onError = vi.fn();
		const failing: AsyncStorageLike = {
			getItem: () => Promise.reject(new Error('denied')),
			setItem: () => Promise.reject(new Error('denied')),
			removeItem: () => Promise.reject(new Error('denied'))
		};
		const { api, dispose } = await mountUtil(() =>
			useStorageAsync('broken', 'safe', failing, { onError })
		);
		try {
			await api;
			expect(api.value).toBe('safe');
			// Mount read (1) + mount write-through (1).
			expect(onError).toHaveBeenCalledTimes(2);
			api.value = 'attempt';
			await settled();
			expect(api.value).toBe('attempt');
			// Plus the set write (1).
			expect(onError).toHaveBeenCalledTimes(3);
		} finally {
			await dispose();
		}
	});

	it('supports async serializers', async () => {
		const backend = memoryStorage();
		const { api, dispose } = await mountUtil(() =>
			useStorageAsync('when', new Date('2026-01-01T00:00:00Z'), backend, {
				serializer: {
					read: async (raw: string) => new Date(raw),
					write: async (value: Date) => value.toISOString()
				}
			})
		);
		try {
			await api;
			api.value = new Date('2026-06-01T00:00:00Z');
			await settled();
			expect(backend.store.get('when')).toBe('2026-06-01T00:00:00.000Z');
			expect(api.value).toBeInstanceOf(Date);
		} finally {
			await dispose();
		}
	});
});
