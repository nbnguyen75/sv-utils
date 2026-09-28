// @vitest-environment jsdom
/**
 * Tests for `useStorage` / `useLocalStorage` / `useSessionStorage`:
 * defaults, persistence, serializers, cross-tab sync, and storage
 * failure fallbacks.
 */
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useLocalStorage, useSessionStorage } from './index.ts';
import type { UseStorageReturn } from './index.ts';

beforeEach(() => {
	window.localStorage.clear();
	window.sessionStorage.clear();
});

const mountCell = <T>(create: () => UseStorageReturn<T>) => mountUtil(create);

describe('useStorage', () => {
	it('returns the default for a missing key and persists write-through', async () => {
		const { api, dispose } = await mountCell(() => useLocalStorage('sv-test-missing', 42));
		try {
			expect(api.value).toBe(42);
			api.value = 7;
			await tick();
			expect(window.localStorage.getItem('sv-test-missing')).toBe('7');
		} finally {
			await dispose();
		}
	});

	it('reads a previously stored JSON value', async () => {
		window.localStorage.setItem('sv-test-exists', '{"a":1}');
		const { api, dispose } = await mountCell(() =>
			useLocalStorage<{ a: number }>('sv-test-exists', { a: 0 })
		);
		try {
			expect(api.value).toEqual({ a: 1 });
		} finally {
			await dispose();
		}
	});

	it('passes plain strings through without JSON quoting', async () => {
		window.localStorage.setItem('sv-test-raw', 'plain');
		const { api, dispose } = await mountCell(() => useLocalStorage('sv-test-raw', 'fallback'));
		try {
			expect(api.value).toBe('plain');
			api.value = 'updated';
			await tick();
			expect(window.localStorage.getItem('sv-test-raw')).toBe('updated');
		} finally {
			await dispose();
		}
	});

	it('round-trips objects and restores them on remount', async () => {
		const first = await mountCell(() => useLocalStorage('sv-test-obj', { items: [] as string[] }));
		first.api.value = { items: ['a', 'b'] };
		await tick();
		await first.dispose();
		const second = await mountCell(() => useLocalStorage('sv-test-obj', { items: [] as string[] }));
		try {
			expect(second.api.value).toEqual({ items: ['a', 'b'] });
		} finally {
			await second.dispose();
		}
	});

	it('honors a custom serializer', async () => {
		const hex = {
			read: (raw: string) => Number.parseInt(raw, 16),
			write: (value: number) => value.toString(16)
		};
		const { api, dispose } = await mountCell(() => useLocalStorage('sv-test-hex', 0, hex));
		try {
			api.value = 255;
			await tick();
			expect(window.localStorage.getItem('sv-test-hex')).toBe('ff');
			expect(api.value).toBe(255);
		} finally {
			await dispose();
		}
	});

	it('falls back to the default when the serializer throws', async () => {
		window.localStorage.setItem('sv-test-bad', '###');
		const throwing = {
			read: (_raw: string): number => {
				throw new Error('cannot parse');
			},
			write: (value: number) => String(value)
		};
		const { api, dispose } = await mountCell(() => useLocalStorage('sv-test-bad', 9, throwing));
		try {
			expect(api.value).toBe(9);
		} finally {
			await dispose();
		}
	});

	it('falls back to the default when storage access throws', async () => {
		const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('denied');
		});
		const { api, dispose } = await mountCell(() => useLocalStorage('sv-test-deny', 'safe'));
		try {
			expect(api.value).toBe('safe');
		} finally {
			await dispose();
		}
		expect(getItem).toHaveBeenCalled();
	});

	it('survives write failures and keeps the in-memory value', async () => {
		const { api, dispose } = await mountCell(() => useLocalStorage('sv-test-full', 'a'));
		const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('full');
		});
		try {
			api.value = 'b';
			await tick();
			expect(api.value).toBe('b');
		} finally {
			await dispose();
		}
		expect(setItem).toHaveBeenCalled();
	});

	it('syncs across instances via storage events', async () => {
		const first = await mountCell(() => useLocalStorage('sv-test-sync', 'one'));
		const second = await mountCell(() => useLocalStorage('sv-test-sync', 'one'));
		try {
			window.dispatchEvent(new StorageEvent('storage', { key: 'sv-test-sync', newValue: '"two"' }));
			await tick();
			expect(first.api.value).toBe('two');
			expect(second.api.value).toBe('two');
			// Unrelated keys are ignored.
			window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '"x"' }));
			await tick();
			expect(first.api.value).toBe('two');
		} finally {
			await first.dispose();
			await second.dispose();
		}
	});

	it('useSessionStorage isolates from localStorage', async () => {
		const { api, dispose } = await mountCell(() => useSessionStorage('sv-test-sess', 's'));
		try {
			api.value = 'updated';
			await tick();
			expect(window.sessionStorage.getItem('sv-test-sess')).toBe('updated');
			expect(window.localStorage.getItem('sv-test-sess')).toBeNull();
		} finally {
			await dispose();
		}
	});
});
