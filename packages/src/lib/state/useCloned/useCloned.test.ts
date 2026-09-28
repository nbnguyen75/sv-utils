// @vitest-environment jsdom
/**
 * Tests for `useCloned`: initial clone, dirty flag, manual sync,
 * source re-sync, custom cloners, and structured-clone defaults.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCloned } from './index.ts';
import type { UseClonedOptions } from './index.ts';

const mountCloned = <T>(source: () => T, options?: UseClonedOptions<T>) =>
	mountUtil(() => useCloned(source, options));

describe('useCloned', () => {
	it('deep-clones on init without marking modified', async () => {
		const box = createBox({ nested: { count: 1 } });
		const { api, dispose } = await mountCloned(() => box.value);
		try {
			expect(api.value).toEqual({ nested: { count: 1 } });
			expect(api.value).not.toBe(box.value);
			expect(api.isModified).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('marks modified on clone edits and clears on sync', async () => {
		const box = createBox({ nested: { count: 1 } });
		const { api, dispose } = await mountCloned(() => box.value);
		try {
			api.value.nested.count = 2;
			await tick();
			expect(api.isModified).toBe(true);
			expect(box.value.nested.count).toBe(1);
			api.sync();
			await tick();
			expect(api.isModified).toBe(false);
			expect(api.value).toEqual({ nested: { count: 1 } });
		} finally {
			await dispose();
		}
	});

	it('re-syncs automatically when the source changes', async () => {
		const box = createBox({ nested: { count: 1 } });
		const { api, dispose } = await mountCloned(() => box.value);
		try {
			api.value.nested.count = 99;
			await tick();
			expect(api.isModified).toBe(true);
			box.value = { nested: { count: 7 } };
			await tick();
			expect(api.value).toEqual({ nested: { count: 7 } });
			expect(api.isModified).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('re-syncs on nested source edits', async () => {
		const box = createBox({ nested: { count: 1 } });
		const { api, dispose } = await mountCloned(() => box.value);
		try {
			box.value.nested.count = 42;
			await tick();
			expect(api.value).toEqual({ nested: { count: 42 } });
			expect(api.isModified).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('ignores source changes in manual mode until sync', async () => {
		const box = createBox({ n: 1 });
		const { api, dispose } = await mountCloned(() => box.value, { manual: true });
		try {
			box.value = { n: 2 };
			await tick();
			expect(api.value).toEqual({ n: 1 });
			api.sync();
			await tick();
			expect(api.value).toEqual({ n: 2 });
			expect(api.isModified).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('uses a custom clone function', async () => {
		const box = createBox({ n: 1 });
		const { api, dispose } = await mountCloned(() => box.value, {
			clone: (source) => ({ ...source, n: source.n * 10 })
		});
		try {
			expect(api.value).toEqual({ n: 10 });
		} finally {
			await dispose();
		}
	});

	it('preserves Dates via structuredClone by default', async () => {
		const box = createBox({ at: new Date('2026-01-01T00:00:00Z') });
		const { api, dispose } = await mountCloned(() => box.value);
		try {
			expect(api.value.at).toBeInstanceOf(Date);
			expect(api.value.at.toISOString()).toBe('2026-01-01T00:00:00.000Z');
		} finally {
			await dispose();
		}
	});
});
