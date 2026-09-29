// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { syncRef } from './index.ts';

describe('syncRef', () => {
	it('syncs both directions by default', async () => {
		const left = createBox(1);
		const right = createBox(0);
		const { dispose } = await mountUtil(() => syncRef(left, right));
		try {
			await tick();
			expect(right.value).toBe(1);
			right.value = 5;
			await tick();
			expect(left.value).toBe(5);
		} finally {
			await dispose();
		}
	});

	it('honors ltr-only direction', async () => {
		const left = createBox(1);
		const right = createBox(0);
		const { dispose } = await mountUtil(() => syncRef(left, right, { direction: 'ltr' }));
		try {
			await tick();
			expect(right.value).toBe(1);
			right.value = 9;
			await tick();
			expect(left.value).toBe(1);
			expect(right.value).toBe(9);
		} finally {
			await dispose();
		}
	});

	it('applies transforms per direction', async () => {
		const celsius = createBox(0);
		const fahrenheit = createBox(32);
		const { dispose } = await mountUtil(() =>
			syncRef(celsius, fahrenheit, {
				transform: {
					ltr: (celsiusValue) => (celsiusValue * 9) / 5 + 32,
					rtl: (fahrenheitValue) => ((fahrenheitValue - 32) * 5) / 9
				}
			})
		);
		try {
			await tick();
			celsius.value = 100;
			await tick();
			expect(fahrenheit.value).toBe(212);
			fahrenheit.value = 32;
			await tick();
			expect(celsius.value).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('skips initial alignment with immediate:false', async () => {
		const left = createBox(1);
		const right = createBox(2);
		const { dispose } = await mountUtil(() => syncRef(left, right, { immediate: false }));
		try {
			await tick();
			expect(left.value).toBe(1);
			expect(right.value).toBe(2);
			left.value = 10;
			await tick();
			expect(right.value).toBe(10);
		} finally {
			await dispose();
		}
	});

	it('stop detaches permanently', async () => {
		const left = createBox(1);
		const right = createBox(1);
		let stop: (() => void) | undefined;
		const { dispose } = await mountUtil(() => {
			stop = syncRef(left, right);
			return stop;
		});
		try {
			stop?.();
			left.value = 7;
			await tick();
			expect(right.value).toBe(1);
		} finally {
			await dispose();
		}
	});
});
