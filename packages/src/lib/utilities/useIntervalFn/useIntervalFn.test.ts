// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useIntervalFn } from './index.ts';

describe('useIntervalFn', () => {
	it('auto-starts on mount and repeats', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useIntervalFn(spy, 100));
		try {
			expect(api.isActive).toBe(true);
			vi.advanceTimersByTime(350);
			expect(spy).toHaveBeenCalledTimes(3);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('pauses and resumes', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useIntervalFn(spy, 100, { immediate: false }));
		try {
			expect(api.isActive).toBe(false);
			api.resume();
			expect(api.isActive).toBe(true);
			vi.advanceTimersByTime(200);
			expect(spy).toHaveBeenCalledTimes(2);
			api.pause();
			api.pause();
			expect(api.isActive).toBe(false);
			vi.advanceTimersByTime(500);
			expect(spy).toHaveBeenCalledTimes(2);
			api.resume();
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(3);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('ignores non-positive intervals', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useIntervalFn(spy, 0));
		try {
			expect(api.isActive).toBe(false);
			vi.advanceTimersByTime(1000);
			expect(spy).not.toHaveBeenCalled();
			api.resume();
			expect(api.isActive).toBe(false);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('immediateCallback invokes synchronously on resume', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useIntervalFn(spy, 100, { immediate: false, immediateCallback: true })
		);
		try {
			api.resume();
			expect(spy).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('restarts at the new cadence when a reactive interval changes', async () => {
		vi.useFakeTimers();
		const period = createBox(100);
		const spy = vi.fn();
		const { dispose } = await mountUtil(() => useIntervalFn(spy, () => period.value));
		try {
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(1);
			period.value = 200;
			// Let the tracking effect flush so the timer restarts first.
			await tick();
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('disposes the interval on unmount', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { dispose } = await mountUtil(() => useIntervalFn(spy, 100));
		vi.advanceTimersByTime(200);
		expect(spy).toHaveBeenCalledTimes(2);
		await dispose();
		vi.advanceTimersByTime(1000);
		vi.useRealTimers();
		expect(spy).toHaveBeenCalledTimes(2);
	});
});
