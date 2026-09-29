// @vitest-environment jsdom
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { MockIntersectionObserver } from '../../../../test/fixtures/observers.ts';
import { useInfiniteScroll } from './index.ts';

function makeScroller(): HTMLElement {
	const element = document.createElement('div');
	Object.defineProperty(element, 'scrollHeight', { configurable: true, value: 200 });
	Object.defineProperty(element, 'clientHeight', { configurable: true, value: 100 });
	Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 200 });
	Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 });
	element.scrollTop = 0;
	document.body.appendChild(element);
	return element;
}

async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
	MockIntersectionObserver.install();
});

describe('useInfiniteScroll', () => {
	it('loads when the bottom edge arrives while visible', async () => {
		const element = makeScroller();
		let remaining = 1;
		const onLoadMore = vi.fn(async () => {
			remaining -= 1;
		});
		const { api, dispose } = await mountUtil(() =>
			useInfiniteScroll(() => element, onLoadMore, {
				canLoadMore: () => remaining > 0,
				interval: 10
			})
		);
		try {
			expect(api.isLoading).toBe(false);
			element.scrollTop = 150;
			element.dispatchEvent(new window.Event('scroll'));
			MockIntersectionObserver.triggerIntersecting(element, true);
			await tick();
			expect(onLoadMore).toHaveBeenCalledTimes(1);
			expect(api.isLoading).toBe(true);
			await sleep(50);
			expect(api.isLoading).toBe(false);
			// Settled without new arrivals: no further loads.
			await sleep(50);
			expect(onLoadMore).toHaveBeenCalledTimes(1);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('skips loading when invisible or gated', async () => {
		const element = makeScroller();
		const onLoadMore = vi.fn(async () => {});
		const { dispose } = await mountUtil(() =>
			useInfiniteScroll(() => element, onLoadMore, {
				canLoadMore: () => false,
				interval: 10
			})
		);
		try {
			element.scrollTop = 150;
			element.dispatchEvent(new window.Event('scroll'));
			MockIntersectionObserver.triggerIntersecting(element, true);
			await tick();
			await sleep(30);
			expect(onLoadMore).not.toHaveBeenCalled();
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('reset re-checks conditions', async () => {
		const element = makeScroller();
		let remaining = 1;
		const onLoadMore = vi.fn(async () => {
			remaining -= 1;
		});
		const { api, dispose } = await mountUtil(() =>
			useInfiniteScroll(() => element, onLoadMore, {
				canLoadMore: () => remaining > 0,
				interval: 10
			})
		);
		try {
			element.scrollTop = 150;
			element.dispatchEvent(new window.Event('scroll'));
			MockIntersectionObserver.triggerIntersecting(element, true);
			await tick();
			expect(onLoadMore).toHaveBeenCalledTimes(1);
			await sleep(50);
			remaining = 1;
			api.reset();
			await sleep(50);
			expect(onLoadMore).toHaveBeenCalledTimes(2);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('loads for a window target without an intersection callback', async () => {
		const root = document.documentElement;
		// jsdom has no layout engine: fake a scrolled page. useScroll reads
		// the page scroll position off <html>, not window.scrollY.
		Object.defineProperty(root, 'scrollTop', { configurable: true, value: 150 });
		Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 200 });
		Object.defineProperty(root, 'clientHeight', { configurable: true, value: 100 });
		let remaining = 1;
		const onLoadMore = vi.fn(async () => {
			remaining -= 1;
		});
		const { dispose } = await mountUtil(() =>
			useInfiniteScroll(() => window, onLoadMore, {
				interval: 10,
				canLoadMore: () => remaining > 0
			})
		);
		try {
			window.dispatchEvent(new window.Event('scroll'));
			await tick();
			await sleep(30);
			expect(onLoadMore).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});
});
