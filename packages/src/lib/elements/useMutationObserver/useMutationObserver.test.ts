// @vitest-environment jsdom
/**
 * Tests for `useMutationObserver`: observation, options, takeRecords,
 * stop, and disposal. Uses the native jsdom MutationObserver.
 */
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useMutationObserver } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

describe('useMutationObserver', () => {
	it('reports DOM mutations', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useMutationObserver(
				() => element,
				(...args) => spy(...args),
				{ childList: true }
			)
		);
		try {
			expect(api.isSupported).toBe(true);
			element.appendChild(document.createElement('span'));
			await tick();
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0].length).toBeGreaterThan(0);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('takeRecords drains pending records without disconnecting', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useMutationObserver(
				() => element,
				(...args) => spy(...args),
				{
					attributes: true
				}
			)
		);
		try {
			element.setAttribute('data-x', '1');
			const records = api.takeRecords();
			expect(records?.length).toBeGreaterThan(0);
			element.setAttribute('data-y', '2');
			await tick();
			await tick();
			expect(spy).toHaveBeenCalled();
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stop disconnects permanently', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useMutationObserver(
				() => element,
				(...args) => spy(...args),
				{ childList: true }
			)
		);
		try {
			api.stop();
			api.stop();
			element.appendChild(document.createElement('span'));
			await tick();
			await tick();
			expect(spy).not.toHaveBeenCalled();
			expect(api.takeRecords()).toBeUndefined();
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('disconnects on unmount', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { dispose } = await mountUtil(() =>
			useMutationObserver(
				() => element,
				(...args) => spy(...args),
				{ childList: true }
			)
		);
		await dispose();
		element.appendChild(document.createElement('span'));
		element.remove();
		await tick();
		await tick();
		expect(spy).not.toHaveBeenCalled();
	});
});
