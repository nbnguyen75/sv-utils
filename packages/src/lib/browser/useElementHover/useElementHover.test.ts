// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useElementHover } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

describe('useElementHover', () => {
	it('tracks enter and leave', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementHover(() => element));
		try {
			expect(api.value).toBe(false);
			element.dispatchEvent(new window.MouseEvent('mouseenter'));
			await tick();
			expect(api.value).toBe(true);
			element.dispatchEvent(new window.MouseEvent('mouseleave'));
			await tick();
			expect(api.value).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('delays enter and leave', async () => {
		vi.useFakeTimers();
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementHover(() => element, { delayEnter: 100, delayLeave: 100 })
		);
		try {
			element.dispatchEvent(new window.MouseEvent('mouseenter'));
			await tick();
			expect(api.value).toBe(false);
			vi.advanceTimersByTime(100);
			await tick();
			expect(api.value).toBe(true);
			element.dispatchEvent(new window.MouseEvent('mouseleave'));
			await tick();
			expect(api.value).toBe(true);
			vi.advanceTimersByTime(100);
			await tick();
			expect(api.value).toBe(false);
		} finally {
			vi.useRealTimers();
			element.remove();
			await dispose();
		}
	});

	it('re-entry cancels a pending leave', async () => {
		vi.useFakeTimers();
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementHover(() => element, { delayLeave: 100 })
		);
		try {
			element.dispatchEvent(new window.MouseEvent('mouseenter'));
			await tick();
			expect(api.value).toBe(true);
			element.dispatchEvent(new window.MouseEvent('mouseleave'));
			await tick();
			element.dispatchEvent(new window.MouseEvent('mouseenter'));
			await tick();
			vi.advanceTimersByTime(200);
			await tick();
			expect(api.value).toBe(true);
		} finally {
			vi.useRealTimers();
			element.remove();
			await dispose();
		}
	});

	it('clears hover when the element is removed with triggerOnRemoval', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementHover(() => element, { triggerOnRemoval: true })
		);
		try {
			element.dispatchEvent(new window.MouseEvent('mouseenter'));
			await tick();
			expect(api.value).toBe(true);
			element.remove();
			await tick();
			await tick();
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('disposes a pending timer on unmount', async () => {
		vi.useFakeTimers();
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementHover(() => element, { delayLeave: 100 })
		);
		element.dispatchEvent(new window.MouseEvent('mouseenter'));
		await tick();
		expect(api.value).toBe(true);
		element.dispatchEvent(new window.MouseEvent('mouseleave'));
		await tick();
		await dispose();
		element.remove();
		vi.advanceTimersByTime(500);
		vi.useRealTimers();
		expect(api.value).toBe(true);
	});
});
