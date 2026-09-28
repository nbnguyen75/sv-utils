// @vitest-environment jsdom
/**
 * Tests for `useLastChanged`: default null, change stamps, immediate mode,
 * and initial values. Runs mounted (the source is sampled in `$effect`).
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useLastChanged } from './index.ts';
import type { UseLastChangedOptions } from './index.ts';

const mountLastChanged = (source: () => unknown, options?: UseLastChangedOptions) =>
	mountUtil(() => useLastChanged(source, options));

describe('useLastChanged', () => {
	it('is null until the first change by default', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountLastChanged(() => box.value);
		try {
			expect(api.value).toBeNull();
			const before = Date.now();
			box.value = 2;
			await tick();
			const after = Date.now();
			expect(api.value).not.toBeNull();
			expect(api.value as number).toBeGreaterThanOrEqual(before);
			expect(api.value as number).toBeLessThanOrEqual(after);
		} finally {
			await dispose();
		}
	});

	it('re-stamps on every change', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountLastChanged(() => box.value);
		try {
			box.value = 2;
			await tick();
			const first = api.value;
			expect(first).not.toBeNull();
			await new Promise((resolve) => setTimeout(resolve, 5));
			box.value = 3;
			await tick();
			expect(api.value).not.toBeNull();
			expect(api.value as number).toBeGreaterThanOrEqual(first as number);
		} finally {
			await dispose();
		}
	});

	it('stamps mount time with immediate:true', async () => {
		const before = Date.now();
		const box = createBox(1);
		const { api, dispose } = await mountLastChanged(() => box.value, { immediate: true });
		try {
			const after = Date.now();
			expect(api.value).not.toBeNull();
			expect(api.value as number).toBeGreaterThanOrEqual(before);
			expect(api.value as number).toBeLessThanOrEqual(after);
		} finally {
			await dispose();
		}
	});

	it('honors an explicit initial value', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountLastChanged(() => box.value, {
			initialValue: 1234
		});
		try {
			expect(api.value).toBe(1234);
			box.value = 2;
			await tick();
			expect(api.value).not.toBe(1234);
		} finally {
			await dispose();
		}
	});
});
