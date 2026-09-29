// @vitest-environment jsdom
/**
 * Tests for `useRafFn`: frame args, pause/resume, once mode, FPS cap,
 * and unmount disposal. Frames are stepped manually for determinism.
 */
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { mockRaf } from '../../../../test/fixtures/raf.ts';
import { useRafFn } from './index.ts';
import type { UseRafFnCallbackArguments } from './index.ts';

describe('useRafFn', () => {
	it('runs every frame with delta and timestamp', async () => {
		const raf = mockRaf();
		const seen: UseRafFnCallbackArguments[] = [];
		const { api, dispose } = await mountUtil(() =>
			useRafFn((args) => {
				seen.push(args);
			})
		);
		try {
			expect(api.isActive).toBe(true);
			// First frame initializes the baseline: delta 0.
			raf.step(1000);
			raf.step(1016);
			raf.step(1032);
			expect(seen).toEqual([
				{ delta: 0, timestamp: 1000 },
				{ delta: 16, timestamp: 1016 },
				{ delta: 16, timestamp: 1032 }
			]);
		} finally {
			await dispose();
		}
	});

	it('pauses and resumes', async () => {
		const raf = mockRaf();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useRafFn(spy));
		try {
			raf.step(1000);
			expect(spy).toHaveBeenCalledTimes(1);
			api.pause();
			api.pause();
			expect(api.isActive).toBe(false);
			expect(raf.pending).toBe(false);
			raf.step(2000);
			expect(spy).toHaveBeenCalledTimes(1);
			api.resume();
			expect(api.isActive).toBe(true);
			raf.step(3000);
			expect(spy).toHaveBeenCalledTimes(2);
		} finally {
			await dispose();
		}
	});

	it('stays idle with immediate:false until resume', async () => {
		const raf = mockRaf();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useRafFn(spy, { immediate: false }));
		try {
			expect(api.isActive).toBe(false);
			expect(raf.pending).toBe(false);
			api.resume();
			raf.step(1000);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('stops after one frame with once:true', async () => {
		const raf = mockRaf();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useRafFn(spy, { once: true }));
		try {
			raf.step(1000);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(api.isActive).toBe(false);
			raf.step(2000);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('skips frames above the fpsLimit budget', async () => {
		const raf = mockRaf();
		const spy = vi.fn();
		const { dispose } = await mountUtil(() => useRafFn(spy, { fpsLimit: 10 }));
		try {
			// First frame initializes the baseline (delta 0 < 100ms budget): skipped.
			raf.step(1000);
			expect(spy).not.toHaveBeenCalled();
			// 50ms later: still inside the budget, skipped.
			raf.step(1050);
			expect(spy).not.toHaveBeenCalled();
			// Past the budget: executes with the full delta.
			raf.step(1100);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenLastCalledWith({ delta: 100, timestamp: 1100 });
		} finally {
			await dispose();
		}
	});

	it('resolves a reactive fpsLimit per frame', async () => {
		let limit: number | null = null;
		const raf = mockRaf();
		const spy = vi.fn();
		const { dispose } = await mountUtil(() => useRafFn(spy, { fpsLimit: () => limit }));
		try {
			raf.step(1000);
			raf.step(1016);
			expect(spy).toHaveBeenCalledTimes(2);
			limit = 10;
			raf.step(1032);
			expect(spy).toHaveBeenCalledTimes(2);
			raf.step(1132);
			expect(spy).toHaveBeenCalledTimes(3);
		} finally {
			await dispose();
		}
	});

	it('disposes the loop on unmount', async () => {
		const raf = mockRaf();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useRafFn(spy));
		raf.step(1000);
		expect(spy).toHaveBeenCalledTimes(1);
		await dispose();
		expect(api.isActive).toBe(false);
		raf.step(2000);
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
