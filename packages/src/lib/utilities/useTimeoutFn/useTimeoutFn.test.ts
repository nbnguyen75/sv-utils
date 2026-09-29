// @vitest-environment jsdom
/**
 * Tests for `useTimeoutFn`: auto-start, restart, stop, args, immediate
 * callback, reactive interval reads, and unmount disposal.
 */
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useTimeoutFn } from './index.ts';

describe('useTimeoutFn', () => {
	it('auto-starts on mount and fires once', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useTimeoutFn(spy, 200));
		try {
			expect(api.isPending).toBe(true);
			vi.advanceTimersByTime(199);
			expect(spy).not.toHaveBeenCalled();
			vi.advanceTimersByTime(1);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(api.isPending).toBe(false);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('stays idle with immediate:false until start', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useTimeoutFn(spy, 200, { immediate: false }));
		try {
			expect(api.isPending).toBe(false);
			vi.advanceTimersByTime(500);
			expect(spy).not.toHaveBeenCalled();
			api.start();
			expect(api.isPending).toBe(true);
			vi.advanceTimersByTime(200);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('stop disarms and is safe repeated', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useTimeoutFn(spy, 200));
		try {
			api.stop();
			api.stop();
			expect(api.isPending).toBe(false);
			vi.advanceTimersByTime(500);
			expect(spy).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('restarting clears the previous timer and forwards args', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useTimeoutFn(spy, 200, { immediate: false }));
		try {
			api.start('a');
			vi.advanceTimersByTime(150);
			api.start('b');
			vi.advanceTimersByTime(150);
			expect(spy).not.toHaveBeenCalled();
			vi.advanceTimersByTime(50);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith('b');
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('immediateCallback invokes synchronously on start plus delayed', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useTimeoutFn(spy, 200, { immediate: false, immediateCallback: true })
		);
		try {
			api.start();
			expect(spy).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(200);
			expect(spy).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('reads a reactive interval at each start', async () => {
		vi.useFakeTimers();
		const period = createBox(100);
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useTimeoutFn(spy, () => period.value, { immediate: false })
		);
		try {
			api.start();
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(1);
			period.value = 300;
			api.start();
			vi.advanceTimersByTime(100);
			expect(spy).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(200);
			expect(spy).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('disposes a pending timer on unmount', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useTimeoutFn(spy, 1000, { immediate: false }));
		api.start();
		await dispose();
		vi.advanceTimersByTime(2000);
		vi.useRealTimers();
		expect(spy).not.toHaveBeenCalled();
	});
});
