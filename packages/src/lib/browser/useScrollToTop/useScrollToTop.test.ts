// @vitest-environment jsdom
/**
 * Tests for `useScrollToTop`: animated scroll, cancel, supersede,
 * and disposal on unmount. Uses real timers with short durations plus a
 * `requestAnimationFrame` polyfill (jsdom ships none).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useScrollToTop } from './index.ts';

beforeAll(() => {
	if (typeof window.requestAnimationFrame !== 'function') {
		let nextId = 0;
		window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
			nextId += 1;
			setTimeout(() => callback(Date.now()), 0);
			return nextId;
		};
	}
});

const mountScroller = (target: () => HTMLElement | null, duration = 30) =>
	mountUtil(() => useScrollToTop(target, { duration }));

function makeScrollable(top: number): HTMLElement {
	const el = document.createElement('div');
	el.scrollTop = top;
	document.body.appendChild(el);
	return el;
}

describe('useScrollToTop', () => {
	it('tweens an element to the top and resolves', async () => {
		const el = makeScrollable(500);
		const { api, dispose } = await mountScroller(() => el);
		try {
			expect(api.scrolling).toBe(false);
			const done = api.scrollToTop();
			expect(api.scrolling).toBe(true);
			await done;
			expect(el.scrollTop).toBe(0);
			expect(api.scrolling).toBe(false);
		} finally {
			el.remove();
			await dispose();
		}
	});

	it('cancel aborts an in-flight animation', async () => {
		const el = makeScrollable(500);
		const { api, dispose } = await mountScroller(() => el, 500);
		try {
			const done = api.scrollToTop();
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(api.scrolling).toBe(true);
			api.cancel();
			expect(api.scrolling).toBe(false);
			expect(el.scrollTop).toBeGreaterThan(0);
			await done;
			// Cancelled runs resolve without writing further.
			expect(api.scrolling).toBe(false);
		} finally {
			el.remove();
			await dispose();
		}
	});

	it('a new call supersedes the previous animation', async () => {
		const el = makeScrollable(500);
		const { api, dispose } = await mountScroller(() => el, 60);
		try {
			const first = api.scrollToTop();
			const second = api.scrollToTop();
			await Promise.all([first, second]);
			expect(el.scrollTop).toBe(0);
			expect(api.scrolling).toBe(false);
		} finally {
			el.remove();
			await dispose();
		}
	});

	it('cancel is a safe no-op when idle', async () => {
		const el = makeScrollable(100);
		const { api, dispose } = await mountScroller(() => el);
		try {
			api.cancel();
			api.cancel();
			expect(api.scrolling).toBe(false);
			expect(el.scrollTop).toBe(100);
		} finally {
			el.remove();
			await dispose();
		}
	});

	it('resolves immediately without a target', async () => {
		const { api, dispose } = await mountScroller(() => null);
		try {
			await api.scrollToTop();
			expect(api.scrolling).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('scrolls window to the top by default', async () => {
		// jsdom leaves scrollY undefined: define a start position so the
		// tween interpolates numbers.
		Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
		const scrollTo = vi.fn();
		window.scrollTo = scrollTo;
		const { api, dispose } = await mountUtil(() => useScrollToTop(undefined, { duration: 30 }));
		try {
			await api.scrollToTop();
			expect(scrollTo).toHaveBeenCalled();
			expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
		} finally {
			await dispose();
		}
	});

	it('disposes an in-flight animation on unmount', async () => {
		const el = makeScrollable(500);
		const { api, dispose } = await mountScroller(() => el, 500);
		const done = api.scrollToTop();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(api.scrolling).toBe(true);
		await dispose();
		el.remove();
		await done;
		expect(api.scrolling).toBe(false);
	});
});
