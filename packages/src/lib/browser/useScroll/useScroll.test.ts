// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useScroll } from '../useScroll/index.ts';

function makeScroller(): HTMLElement {
	const element = document.createElement('div');
	Object.defineProperty(element, 'scrollHeight', { configurable: true, value: 200 });
	Object.defineProperty(element, 'clientHeight', { configurable: true, value: 100 });
	Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 200 });
	Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 });
	element.scrollTop = 0;
	element.scrollLeft = 0;
	document.body.appendChild(element);
	return element;
}

describe('useScroll', () => {
	it('measures on mount with top/left arrival', async () => {
		const element = makeScroller();
		const { api, dispose } = await mountUtil(() => useScroll(() => element));
		try {
			expect(api.x).toBe(0);
			expect(api.y).toBe(0);
			expect(api.arrivedState.top).toBe(true);
			expect(api.arrivedState.left).toBe(true);
			expect(api.arrivedState.bottom).toBe(false);
			expect(api.isScrolling).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('tracks scrolls, directions, arrival, and end of scroll', async () => {
		vi.useFakeTimers();
		const element = makeScroller();
		const onScroll = vi.fn();
		const onStop = vi.fn();
		const { api, dispose } = await mountUtil(() => useScroll(() => element, { onScroll, onStop }));
		try {
			element.scrollTop = 150;
			element.dispatchEvent(new window.Event('scroll'));
			await tick();
			expect(api.y).toBe(150);
			expect(api.isScrolling).toBe(true);
			expect(api.directions.bottom).toBe(true);
			expect(api.arrivedState.bottom).toBe(true);
			expect(onScroll).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(200);
			await tick();
			expect(api.isScrolling).toBe(false);
			expect(api.directions.bottom).toBe(false);
			expect(onStop).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
			element.remove();
			await dispose();
		}
	});

	it('ends early on native scrollend', async () => {
		const element = makeScroller();
		const onStop = vi.fn();
		const { api, dispose } = await mountUtil(() => useScroll(() => element, { onStop }));
		try {
			element.dispatchEvent(new window.Event('scroll'));
			await tick();
			expect(api.isScrolling).toBe(true);
			element.dispatchEvent(new window.Event('scrollend'));
			await tick();
			expect(api.isScrolling).toBe(false);
			expect(onStop).toHaveBeenCalledTimes(1);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('writes through x/y setters via scrollTo', async () => {
		const element = makeScroller();
		const scrollTo = vi.fn();
		element.scrollTo = scrollTo;
		const { api, dispose } = await mountUtil(() =>
			useScroll(() => element, { behavior: 'smooth' })
		);
		try {
			api.y = 80;
			expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 80, behavior: 'smooth' });
			api.x = 40;
			expect(scrollTo).toHaveBeenLastCalledWith({ left: 40, top: 0, behavior: 'smooth' });
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('measure re-reads on demand', async () => {
		const element = makeScroller();
		const { api, dispose } = await mountUtil(() => useScroll(() => element));
		try {
			element.scrollTop = 120;
			expect(api.y).toBe(0);
			api.measure();
			expect(api.y).toBe(120);
			expect(api.arrivedState.bottom).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('throttles scroll handling when configured', async () => {
		vi.useFakeTimers();
		const element = makeScroller();
		const onScroll = vi.fn();
		const { dispose } = await mountUtil(() =>
			useScroll(() => element, { onScroll, throttle: 100 })
		);
		try {
			element.dispatchEvent(new window.Event('scroll'));
			element.dispatchEvent(new window.Event('scroll'));
			vi.advanceTimersByTime(100);
			await tick();
			expect(onScroll).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
			element.remove();
			await dispose();
		}
	});
});
