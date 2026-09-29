// @vitest-environment jsdom
/**
 * Tests for `watchTriggerable`: manual triggers, return values,
 * no double-fires, normal notifications, and silence controls.
 */
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { watchTriggerable } from './index.ts';

describe('watchTriggerable', () => {
	it('trigger runs the callback now with the current value', async () => {
		const box = createBox(5);
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			watchTriggerable(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			api.trigger();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toBe(5);
			expect(spy.mock.calls[0]?.[1]).toBeUndefined();
			await tick();
			// No duplicate notification on flush.
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('trigger returns the callback result', async () => {
		const box = createBox(5);
		const { api, dispose } = await mountUtil(() =>
			watchTriggerable(
				() => box.value,
				(value) => value * 2,
				{}
			)
		);
		try {
			expect(api.trigger()).toBe(10);
		} finally {
			await dispose();
		}
	});

	it('notifies on source changes like a normal watcher', async () => {
		const box = createBox(0);
		const spy = vi.fn();
		const { dispose } = await mountUtil(() =>
			watchTriggerable(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			box.value = 1;
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy.mock.calls[0]?.[0]).toBe(1);
			expect(spy.mock.calls[0]?.[1]).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('forwards silence controls and stop', async () => {
		const box = createBox(0);
		const spy = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			watchTriggerable(
				() => box.value,
				(...args) => spy(...args)
			)
		);
		try {
			api.ignoreUpdates(() => {
				box.value = 50;
			});
			await tick();
			expect(spy).not.toHaveBeenCalled();
			api.trigger();
			expect(spy).toHaveBeenCalledTimes(1);
			api.stop();
			box.value = 51;
			await tick();
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});
});
