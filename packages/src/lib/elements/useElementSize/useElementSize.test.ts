// @vitest-environment jsdom
/**
 * Tests for `useElementSize`: observer updates, box modes, fallbacks,
 * mount retention in layout-less environments, target swaps, and stop.
 */
import { tick } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { MockResizeObserver } from '../../../../test/fixtures/observers.ts';
import { useElementSize } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

beforeEach(() => {
	MockResizeObserver.install();
});

describe('useElementSize', () => {
	it('starts at the initial size', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementSize(() => element));
		try {
			expect(api.width).toBe(0);
			expect(api.height).toBe(0);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('applies content-box entries without mutating layout state otherwise', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementSize(() => element));
		try {
			MockResizeObserver.triggerFor(element, {
				contentBoxSize: [{ inlineSize: 120, blockSize: 34 }]
			});
			await tick();
			expect(api.width).toBe(120);
			expect(api.height).toBe(34);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('measures the border box on request', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementSize(() => element, { width: 0, height: 0 }, { box: 'border-box' })
		);
		try {
			MockResizeObserver.triggerFor(element, {
				borderBoxSize: [{ inlineSize: 200, blockSize: 100 }],
				contentBoxSize: [{ inlineSize: 190, blockSize: 90 }]
			});
			await tick();
			expect(api.width).toBe(200);
			expect(api.height).toBe(100);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('falls back to contentRect without box sizes', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementSize(() => element));
		try {
			MockResizeObserver.triggerFor(element, {
				contentRect: { width: 55, height: 11 }
			});
			await tick();
			expect(api.width).toBe(55);
			expect(api.height).toBe(11);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('resets when the target swaps to null', async () => {
		const element = makeDiv();
		const box = createBox<HTMLElement | null>(element);
		const { api, dispose } = await mountUtil(() => useElementSize(() => box.value));
		try {
			MockResizeObserver.triggerFor(element, {
				contentBoxSize: [{ inlineSize: 10, blockSize: 10 }]
			});
			await tick();
			expect(api.width).toBe(10);
			box.value = null;
			await tick();
			expect(api.width).toBe(0);
			expect(api.height).toBe(0);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stop disconnects the observer', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementSize(() => element));
		try {
			api.stop();
			expect(MockResizeObserver.instances.length).toBe(0);
		} finally {
			element.remove();
			await dispose();
		}
	});
});
