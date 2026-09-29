/**
 * Tests for `useMemoize`: hits, refresh, deletion, custom keys/caches.
 * Framework-free — node environment.
 */
import { describe, expect, it, vi } from 'vitest';

import { useMemoize } from './index.ts';
import type { UseMemoizeCache } from './index.ts';

describe('useMemoize', () => {
	it('caches per arguments', () => {
		const resolver = vi.fn((a: number, b: number) => a + b);
		const memoized = useMemoize(resolver);
		expect(memoized(1, 2)).toBe(3);
		expect(memoized(1, 2)).toBe(3);
		expect(resolver).toHaveBeenCalledTimes(1);
		expect(memoized(2, 3)).toBe(5);
		expect(resolver).toHaveBeenCalledTimes(2);
	});

	it('load recomputes and refreshes', () => {
		let version = 1;
		const memoized = useMemoize((id: number) => `${id}@${version}`);
		expect(memoized(7)).toBe('7@1');
		version = 2;
		expect(memoized(7)).toBe('7@1');
		expect(memoized.load(7)).toBe('7@2');
		expect(memoized(7)).toBe('7@2');
	});

	it('deletes single entries and clears all', () => {
		const resolver = vi.fn((id: number) => id * 10);
		const memoized = useMemoize(resolver);
		memoized(1);
		memoized(2);
		memoized.delete(1);
		memoized(1);
		expect(resolver).toHaveBeenCalledTimes(3);
		memoized.clear();
		memoized(1);
		memoized(2);
		expect(resolver).toHaveBeenCalledTimes(5);
	});

	it('uses custom key derivation', () => {
		const resolver = vi.fn((user: { id: number }) => user.id);
		const memoized = useMemoize(resolver, { getKey: (user) => user.id });
		expect(memoized({ id: 1 })).toBe(1);
		expect(memoized({ id: 1 })).toBe(1);
		expect(resolver).toHaveBeenCalledTimes(1);
		expect(memoized.generateKey({ id: 9 })).toBe(9);
	});

	it('supports a custom cache container', () => {
		const store = new Map<unknown, string>();
		const backing: UseMemoizeCache<unknown, string> = {
			get: (key) => store.get(key),
			set: (key, value) => {
				store.set(key, value);
			},
			has: (key) => store.has(key),
			delete: (key) => {
				store.delete(key);
			},
			clear: () => {
				store.clear();
			}
		};
		const memoized = useMemoize((id: number) => `v${id}`, { cache: backing });
		expect(memoized(3)).toBe('v3');
		expect(store.size).toBe(1);
		expect(memoized.cache).toBe(backing);
	});
});
