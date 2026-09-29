// @vitest-environment jsdom
/**
 * Tests for `computedWithControl`: explicit-dep memoization, manual
 * trigger, writable form, and unrelated-state immunity. Runs mounted.
 */
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { computedWithControl } from './index.ts';

describe('computedWithControl', () => {
	it('computes from the source and memoizes between changes', async () => {
		const box = createBox(2);
		const compute = vi.fn((value: number) => value * 10);
		const { api, dispose } = await mountUtil(() =>
			computedWithControl(
				() => box.value,
				() => compute(box.value)
			)
		);
		try {
			expect(api.value).toBe(20);
			expect(compute).toHaveBeenCalledTimes(1);
			expect(api.value).toBe(20);
			expect(compute).toHaveBeenCalledTimes(1);
			box.value = 3;
			await tick();
			expect(api.value).toBe(30);
			expect(compute).toHaveBeenCalledTimes(2);
		} finally {
			await dispose();
		}
	});

	it('ignores unrelated reactive state', async () => {
		const source = createBox(1);
		const other = createBox(100);
		const compute = vi.fn(() => source.value * 2 + other.value * 0);
		const { api, dispose } = await mountUtil(() =>
			computedWithControl(() => source.value, compute)
		);
		try {
			expect(api.value).toBe(2);
			expect(compute).toHaveBeenCalledTimes(1);
			other.value = 200;
			await tick();
			expect(api.value).toBe(2);
			expect(compute).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('trigger forces recomputation', async () => {
		let external = 1;
		const source = createBox(0);
		const { api, dispose } = await mountUtil(() =>
			computedWithControl(
				() => source.value,
				() => external * 2
			)
		);
		try {
			expect(api.value).toBe(2);
			external = 5;
			api.trigger();
			expect(api.value).toBe(10);
		} finally {
			await dispose();
		}
	});

	it('supports writable derivations', async () => {
		const box = createBox('hello');
		const { api, dispose } = await mountUtil(() =>
			computedWithControl(() => box.value, {
				get: () => box.value.toUpperCase(),
				set: (next: string) => {
					box.value = next.toLowerCase();
				}
			})
		);
		try {
			expect(api.value).toBe('HELLO');
			api.value = 'WORLD';
			expect(box.value).toBe('world');
			await tick();
			expect(api.value).toBe('WORLD');
		} finally {
			await dispose();
		}
	});
});
