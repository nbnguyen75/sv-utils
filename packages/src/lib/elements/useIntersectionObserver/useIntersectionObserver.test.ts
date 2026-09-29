// @vitest-environment jsdom
/**
 * Tests for `useIntersectionObserver`: callbacks, pause/resume/stop,
 * immediate mode, options plumbing, and disposal.
 */
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { MockIntersectionObserver } from '../../../../test/fixtures/observers.ts';
import { useIntersectionObserver } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

beforeEach(() => {
	MockIntersectionObserver.install();
});

describe('useIntersectionObserver', () => {
	it('reports intersections and active state', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useIntersectionObserver(
				() => element,
				(...args) => spy(...args)
			)
		);
		try {
			expect(api.isSupported).toBe(true);
			expect(api.isActive).toBe(true);
			MockIntersectionObserver.triggerIntersecting(element, true);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('pauses and resumes', async () => {
		const element = makeDiv();
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useIntersectionObserver(
				() => element,
				(...args) => spy(...args)
			)
		);
		try {
			api.pause();
			expect(api.isActive).toBe(false);
			expect(MockIntersectionObserver.instances.length).toBe(0);
			MockIntersectionObserver.triggerIntersecting(element, true);
			expect(spy).not.toHaveBeenCalled();
			api.resume();
			expect(api.isActive).toBe(true);
			await tick();
			MockIntersectionObserver.triggerIntersecting(element, true);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stays idle with immediate:false until resume', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useIntersectionObserver(
				() => element,
				() => {},
				{ immediate: false }
			)
		);
		try {
			expect(api.isActive).toBe(false);
			expect(MockIntersectionObserver.instances.length).toBe(0);
			api.resume();
			expect(api.isActive).toBe(true);
			await tick();
			expect(MockIntersectionObserver.instances.length).toBe(1);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stop halts permanently and resume stays stopped', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useIntersectionObserver(
				() => element,
				() => {}
			)
		);
		try {
			api.stop();
			expect(api.isActive).toBe(false);
			api.resume();
			expect(api.isActive).toBe(false);
			expect(MockIntersectionObserver.instances.length).toBe(0);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('passes root, margin, and threshold through', async () => {
		const element = makeDiv();
		const root = makeDiv();
		const { dispose } = await mountUtil(() =>
			useIntersectionObserver(
				() => element,
				() => {},
				{
					root: () => root,
					rootMargin: '10px',
					threshold: 0.5
				}
			)
		);
		try {
			const init = MockIntersectionObserver.instances[0]?.init;
			expect(init?.root).toBe(root);
			expect(init?.rootMargin).toBe('10px');
			expect(init?.threshold).toBe(0.5);
		} finally {
			element.remove();
			root.remove();
			await dispose();
		}
	});

	it('disconnects on unmount', async () => {
		const element = makeDiv();
		const { dispose } = await mountUtil(() =>
			useIntersectionObserver(
				() => element,
				() => {}
			)
		);
		expect(MockIntersectionObserver.instances.length).toBe(1);
		await dispose();
		element.remove();
		expect(MockIntersectionObserver.instances.length).toBe(0);
	});

	it('reports unsupported without IntersectionObserver', async () => {
		Object.defineProperty(window, 'IntersectionObserver', {
			configurable: true,
			value: undefined
		});
		try {
			const { api, dispose } = await mountUtil(() =>
				useIntersectionObserver(
					() => document.createElement('div'),
					() => {}
				)
			);
			try {
				expect(api.isSupported).toBe(false);
				// The flag still defaults to the immediate option (VueUse
				// parity) — it only gates rebuilding, of which there is none.
				expect(api.isActive).toBe(true);
				expect(MockIntersectionObserver.instances.length).toBe(0);
			} finally {
				await dispose();
			}
		} finally {
			MockIntersectionObserver.install();
		}
	});
});
