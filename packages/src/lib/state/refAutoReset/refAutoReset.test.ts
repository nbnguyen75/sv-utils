// @vitest-environment jsdom
/**
 * Tests for `refAutoReset`: timed reset, re-arming, getter defaults,
 * and timer disposal on unmount.
 */
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { refAutoReset } from './index.ts';

describe('refAutoReset', () => {
	it('resets to the default after the delay', async () => {
		vi.useFakeTimers();
		const { api, dispose } = await mountUtil(() => refAutoReset('off', 1000));
		try {
			expect(api.value).toBe('off');
			api.value = 'on';
			expect(api.value).toBe('on');
			vi.advanceTimersByTime(999);
			expect(api.value).toBe('on');
			vi.advanceTimersByTime(1);
			expect(api.value).toBe('off');
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('re-arms the timer on every write', async () => {
		vi.useFakeTimers();
		const { api, dispose } = await mountUtil(() => refAutoReset(0, 1000));
		try {
			api.value = 1;
			vi.advanceTimersByTime(800);
			api.value = 2;
			vi.advanceTimersByTime(800);
			expect(api.value).toBe(2);
			vi.advanceTimersByTime(200);
			expect(api.value).toBe(0);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('re-resolves a getter default on every reset', async () => {
		vi.useFakeTimers();
		let fallback = 'a';
		const { api, dispose } = await mountUtil(() => refAutoReset(() => fallback, 100));
		try {
			api.value = 'x';
			fallback = 'b';
			vi.advanceTimersByTime(100);
			expect(api.value).toBe('b');
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('resolves a reactive delay per write', async () => {
		vi.useFakeTimers();
		let delay = 100;
		const { api, dispose } = await mountUtil(() => refAutoReset('d', () => delay));
		try {
			api.value = 'x';
			delay = 1000;
			vi.advanceTimersByTime(100);
			expect(api.value).toBe('d');
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});

	it('disposes a pending reset on unmount', async () => {
		vi.useFakeTimers();
		const { api, dispose } = await mountUtil(() => refAutoReset('d', 1000));
		api.value = 'x';
		await dispose();
		vi.advanceTimersByTime(5000);
		vi.useRealTimers();
		expect(api.value).toBe('x');
	});
});
