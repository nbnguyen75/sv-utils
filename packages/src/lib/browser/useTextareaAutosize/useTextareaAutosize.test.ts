// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useTextareaAutosize } from './index.ts';

/** jsdom has no layout: fake the measured height. */
function makeArea(height: number): HTMLTextAreaElement {
	const area = document.createElement('textarea');
	Object.defineProperty(area, 'scrollHeight', { configurable: true, value: height });
	document.body.appendChild(area);
	return area;
}

describe('useTextareaAutosize', () => {
	it('sizes to content on mount', async () => {
		const area = makeArea(42);
		const { api, dispose } = await mountUtil(() => useTextareaAutosize({ element: () => area }));
		try {
			await tick();
			expect(api.textarea).toBe(area);
			expect(area.style.height).toBe('42px');
		} finally {
			area.remove();
			await dispose();
		}
	});

	it('re-runs when the input changes', async () => {
		const area = makeArea(30);
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const sized = useTextareaAutosize({
				element: () => area,
				input: () => `line ${counter.count}`
			});
			return { counter, sized };
		});
		try {
			await tick();
			expect(area.style.height).toBe('30px');
			expect(api.sized.input).toBe('line 0');
			api.counter.inc();
			await tick();
			await tick();
			expect(api.sized.input).toBe('line 1');
		} finally {
			area.remove();
			await dispose();
		}
	});

	it('clamps to maxHeight', async () => {
		const area = makeArea(200);
		const { dispose } = await mountUtil(() =>
			useTextareaAutosize({ element: () => area, maxHeight: 100 })
		);
		try {
			await tick();
			expect(area.style.height).toBe('100px');
		} finally {
			area.remove();
			await dispose();
		}
	});

	it('writes to the style target with minHeight', async () => {
		const area = makeArea(64);
		const target = document.createElement('div');
		document.body.appendChild(target);
		const { dispose } = await mountUtil(() =>
			useTextareaAutosize({
				element: () => area,
				styleTarget: () => target,
				styleProp: 'minHeight'
			})
		);
		try {
			await tick();
			expect(target.style.minHeight).toBe('64px');
		} finally {
			area.remove();
			target.remove();
			await dispose();
		}
	});

	it('reports resizes and supports manual triggers', async () => {
		const area = makeArea(42);
		const onResize = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useTextareaAutosize({ element: () => area, onResize })
		);
		try {
			await tick();
			expect(onResize).toHaveBeenCalledTimes(1);
			api.triggerResize();
			expect(onResize).toHaveBeenCalledTimes(1);
		} finally {
			area.remove();
			await dispose();
		}
	});

	it('is a no-op without an element', async () => {
		const { api, dispose } = await mountUtil(() => useTextareaAutosize({}));
		try {
			expect(api.textarea).toBeNull();
			expect(() => api.triggerResize()).not.toThrow();
		} finally {
			await dispose();
		}
	});
});
