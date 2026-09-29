// @vitest-environment jsdom
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { MockResizeObserver } from '../../../../test/fixtures/observers.ts';
import { useResizeObserver } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

beforeEach(() => {
	MockResizeObserver.install();
});

describe('useResizeObserver', () => {
	it('observes a single element and reports entries', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useResizeObserver(() => element, spy));
		try {
			expect(api.isSupported).toBe(true);
			expect(MockResizeObserver.observedCount()).toBe(1);
			MockResizeObserver.triggerFor(element, { contentRect: { width: 10 } });
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('observes arrays and skips nullish entries', async () => {
		const first = makeDiv();
		const second = makeDiv();
		const { dispose } = await mountUtil(() =>
			useResizeObserver([() => first, () => null, () => second], () => {})
		);
		try {
			expect(MockResizeObserver.observedCount()).toBe(2);
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('re-observes when the target swaps', async () => {
		const first = makeDiv();
		const second = makeDiv();
		const box = createBox<HTMLElement | null>(first);
		const spy = vi.fn();
		const { dispose } = await mountUtil(() =>
			useResizeObserver(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			MockResizeObserver.triggerFor(first, {});
			expect(spy).toHaveBeenCalledTimes(1);
			box.value = second;
			await tick();
			MockResizeObserver.triggerFor(first, {});
			expect(spy).toHaveBeenCalledTimes(1);
			MockResizeObserver.triggerFor(second, {});
			expect(spy).toHaveBeenCalledTimes(2);
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('stop disconnects permanently', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() => useResizeObserver(() => element, spy));
		try {
			api.stop();
			api.stop();
			expect(MockResizeObserver.instances.length).toBe(0);
			MockResizeObserver.triggerFor(element, {});
			expect(spy).not.toHaveBeenCalled();
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('disconnects on unmount', async () => {
		const element = makeDiv();
		const { dispose } = await mountUtil(() =>
			useResizeObserver(
				() => element,
				() => {}
			)
		);
		expect(MockResizeObserver.instances.length).toBe(1);
		await dispose();
		element.remove();
		expect(MockResizeObserver.instances.length).toBe(0);
	});

	it('reports unsupported without ResizeObserver', async () => {
		Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: undefined });
		try {
			const { api, dispose } = await mountUtil(() =>
				useResizeObserver(
					() => document.createElement('div'),
					() => {}
				)
			);
			try {
				expect(api.isSupported).toBe(false);
			} finally {
				await dispose();
			}
		} finally {
			MockResizeObserver.install();
		}
	});
});
