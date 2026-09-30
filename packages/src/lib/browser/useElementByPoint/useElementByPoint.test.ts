// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useElementByPoint } from './index.ts';
import type { UseElementByPointScheduler } from './index.ts';

/** Run the query synchronously at setup: fully deterministic. */
function syncScheduler(fn: () => void): UseElementByPointScheduler {
	fn();
	return { isActive: false, pause: () => {}, resume: () => {} };
}

function installHitTesting(hit: HTMLElement): void {
	Object.defineProperty(document, 'elementFromPoint', {
		configurable: true,
		value: () => hit
	});
	Object.defineProperty(document, 'elementsFromPoint', {
		configurable: true,
		value: () => [hit]
	});
}

describe('useElementByPoint', () => {
	it('returns the element under the point', async () => {
		const box = document.createElement('div');
		document.body.appendChild(box);
		installHitTesting(box);
		const { api, dispose } = await mountUtil(() =>
			useElementByPoint({ x: 10, y: 20, scheduler: syncScheduler })
		);
		try {
			expect(api.isSupported).toBe(true);
			expect(api.element).toBe(box);
		} finally {
			box.remove();
			await dispose();
		}
	});

	it('returns the hit stack with multiple', async () => {
		const box = document.createElement('div');
		document.body.appendChild(box);
		installHitTesting(box);
		const { api, dispose } = await mountUtil(() =>
			useElementByPoint({ x: 10, y: 20, multiple: true, scheduler: syncScheduler })
		);
		try {
			expect(api.element).toEqual([box]);
		} finally {
			box.remove();
			await dispose();
		}
	});

	it('tracks getter coordinates', async () => {
		const first = document.createElement('div');
		const second = document.createElement('span');
		document.body.append(first, second);
		let current: HTMLElement = first;
		Object.defineProperty(document, 'elementFromPoint', {
			configurable: true,
			value: () => current
		});
		let px = 10;
		const queries: Array<[number, number]> = [];
		const { api, dispose } = await mountUtil(() =>
			useElementByPoint({
				x: () => px,
				y: 20,
				scheduler: (fn) => {
					const run = () => {
						queries.push([px, 20]);
						fn();
					};
					run();
					return { isActive: false, pause: () => {}, resume: run };
				}
			})
		);
		try {
			expect(api.element).toBe(first);
			expect(queries).toEqual([[10, 20]]);
			px = 40;
			current = second;
			api.resume();
			expect(queries).toEqual([
				[10, 20],
				[40, 20]
			]);
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('reports unsupported without the API', async () => {
		// Earlier tests in this file install the hit-testing fakes; remove
		// them first for a genuine negative.
		for (const name of ['elementFromPoint', 'elementsFromPoint'] as const) {
			const descriptor = Object.getOwnPropertyDescriptor(document, name);
			if (descriptor?.configurable) {
				delete (document as unknown as Record<string, unknown>)[name];
			}
		}
		const { api, dispose } = await mountUtil(() =>
			useElementByPoint({ x: 0, y: 0, scheduler: syncScheduler })
		);
		try {
			expect(api.isSupported).toBe(false);
			expect(api.element).toBeNull();
		} finally {
			await dispose();
		}
	});

	it('exposes scheduler controls', async () => {
		const box = document.createElement('div');
		document.body.appendChild(box);
		installHitTesting(box);
		const pause = vi.fn();
		const resume = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useElementByPoint({
				x: 0,
				y: 0,
				scheduler: () => ({ isActive: true, pause, resume })
			})
		);
		try {
			expect(api.isActive).toBe(true);
			api.pause();
			api.resume();
			expect(pause).toHaveBeenCalledTimes(1);
			expect(resume).toHaveBeenCalledTimes(1);
		} finally {
			box.remove();
			await dispose();
		}
	});
});
