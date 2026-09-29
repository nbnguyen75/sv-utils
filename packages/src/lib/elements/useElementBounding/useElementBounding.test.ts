// @vitest-environment jsdom
/**
 * Tests for `useElementBounding`: manual updates, rect mapping, window
 * listeners, observer triggers, target swaps, immediacy, and reset.
 */
import { tick } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { MockResizeObserver } from '../../../../test/fixtures/observers.ts';
import { useElementBounding } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

function mockRect(element: HTMLElement, rect: Partial<DOMRect>) {
	element.getBoundingClientRect = () =>
		({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			...rect
		}) as DOMRect;
}

beforeEach(() => {
	MockResizeObserver.install();
});

describe('useElementBounding', () => {
	it('measures on mount by default', async () => {
		const element = makeDiv();
		mockRect(element, { width: 100, height: 50, top: 10, left: 20, x: 20, y: 10 });
		const { api, dispose } = await mountUtil(() => useElementBounding(() => element));
		try {
			expect(api.width).toBe(100);
			expect(api.height).toBe(50);
			expect(api.top).toBe(10);
			expect(api.left).toBe(20);
			expect(api.x).toBe(20);
			expect(api.y).toBe(10);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stays zeroed without immediate until update', async () => {
		const element = makeDiv();
		mockRect(element, { width: 100 });
		const { api, dispose } = await mountUtil(() =>
			useElementBounding(() => element, { immediate: false })
		);
		try {
			expect(api.width).toBe(0);
			api.update();
			expect(api.width).toBe(100);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('refreshes on window scroll and resize', async () => {
		const element = makeDiv();
		mockRect(element, { width: 10 });
		const { api, dispose } = await mountUtil(() => useElementBounding(() => element));
		try {
			expect(api.width).toBe(10);
			mockRect(element, { width: 30 });
			window.dispatchEvent(new window.Event('scroll', { bubbles: false }));
			await tick();
			expect(api.width).toBe(30);
			mockRect(element, { width: 40 });
			window.dispatchEvent(new window.Event('resize'));
			await tick();
			expect(api.width).toBe(40);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('refreshes on resize observations and style mutations', async () => {
		const element = makeDiv();
		mockRect(element, { width: 10 });
		const { api, dispose } = await mountUtil(() => useElementBounding(() => element));
		try {
			mockRect(element, { width: 60 });
			MockResizeObserver.triggerFor(element, {});
			await tick();
			expect(api.width).toBe(60);
			mockRect(element, { width: 70 });
			element.setAttribute('style', 'width: 70px');
			await tick();
			await tick();
			expect(api.width).toBe(70);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('re-measures when the target swaps', async () => {
		const first = makeDiv();
		const second = makeDiv();
		mockRect(first, { width: 11 });
		mockRect(second, { width: 22 });
		const box = createBox<HTMLElement | null>(first);
		const { api, dispose } = await mountUtil(() => useElementBounding(() => box.value));
		try {
			expect(api.width).toBe(11);
			box.value = second;
			await tick();
			expect(api.width).toBe(22);
			box.value = null;
			await tick();
			expect(api.width).toBe(0);
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('resets to zeros on unmount by default', async () => {
		const element = makeDiv();
		mockRect(element, { width: 10 });
		const { api, dispose } = await mountUtil(() => useElementBounding(() => element));
		expect(api.width).toBe(10);
		await dispose();
		element.remove();
		expect(api.width).toBe(0);
	});

	it('keeps values on unmount with reset:false', async () => {
		const element = makeDiv();
		mockRect(element, { width: 10 });
		const { api, dispose } = await mountUtil(() =>
			useElementBounding(() => element, { reset: false })
		);
		expect(api.width).toBe(10);
		await dispose();
		element.remove();
		expect(api.width).toBe(10);
	});

	it('defers measurement a frame with next-frame timing', async () => {
		const element = makeDiv();
		mockRect(element, { width: 77 });
		const { api, dispose } = await mountUtil(() =>
			useElementBounding(() => element, { immediate: false, updateTiming: 'next-frame' })
		);
		try {
			api.update();
			expect(api.width).toBe(0);
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(api.width).toBe(77);
		} finally {
			element.remove();
			await dispose();
		}
	});
});
