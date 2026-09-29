// @vitest-environment jsdom
/**
 * Tests for `watchIgnorable`: normal fires, silent updates, pending
 * drops, immediate mode, stop, and cleanup. Runs mounted.
 */
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { watchIgnorable } from './index.ts';

describe('watchIgnorable', () => {
	it('fires normally with new and old values', async () => {
		const box = createBox(0);
		const spy = vi.fn();
		const { dispose } = await mountUtil(() =>
			watchIgnorable(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			box.value = 1;
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toBe(1);
			expect(spy.mock.calls[0]?.[1]).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('ignoreUpdates skips exactly the wrapped mutation', async () => {
		const box = createBox(0);
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			watchIgnorable(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			api.ignoreUpdates(() => {
				box.value = 99;
			});
			await tick();
			expect(spy).not.toHaveBeenCalled();
			box.value = 100;
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toBe(100);
			expect(spy.mock.calls[0]?.[1]).toBe(99);
		} finally {
			await dispose();
		}
	});

	it('ignorePrevAsyncUpdates drops a pending change', async () => {
		const box = createBox(0);
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			watchIgnorable(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			box.value = 1;
			api.ignorePrevAsyncUpdates();
			await tick();
			expect(spy).not.toHaveBeenCalled();
			box.value = 2;
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toBe(2);
		} finally {
			await dispose();
		}
	});

	it('fires on mount with immediate:true', async () => {
		const box = createBox(7);
		const spy = vi.fn();
		const { dispose } = await mountUtil(() =>
			watchIgnorable(
				() => box.value,
				(...args) => spy(...args),
				{ immediate: true }
			)
		);
		try {
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toBe(7);
			expect(spy.mock.calls[0]?.[1]).toBeUndefined();
		} finally {
			await dispose();
		}
	});

	it('stop halts and runs pending cleanup', async () => {
		const box = createBox(0);
		const order: string[] = [];
		const { api, dispose } = await mountUtil(() =>
			watchIgnorable(
				() => box.value,
				(value, _old, onCleanup) => {
					order.push(`cb:${value}`);
					onCleanup(() => order.push('cleanup'));
				}
			)
		);
		try {
			box.value = 1;
			await tick();
			expect(order).toEqual(['cb:1']);
			api.stop();
			expect(order).toEqual(['cb:1', 'cleanup']);
			box.value = 2;
			await tick();
			expect(order).toEqual(['cb:1', 'cleanup']);
		} finally {
			await dispose();
		}
	});
});
