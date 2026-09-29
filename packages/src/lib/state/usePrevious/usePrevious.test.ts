// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { usePrevious } from './index.ts';

const mountPrevious = <T>(source: () => T, initialValue?: T) =>
	initialValue === undefined
		? mountUtil(() => usePrevious(source))
		: mountUtil(() => usePrevious(source, initialValue));

describe('usePrevious', () => {
	it('is undefined until the first change without an initial value', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountPrevious(() => box.value);
		try {
			expect(api.value).toBeUndefined();
			box.value = 2;
			await tick();
			expect(api.value).toBe(1);
		} finally {
			await dispose();
		}
	});

	it('keeps an explicit initial value until the first change', async () => {
		const box = createBox('a');
		const { api, dispose } = await mountPrevious(() => box.value, 'init');
		try {
			expect(api.value).toBe('init');
			box.value = 'b';
			await tick();
			expect(api.value).toBe('a');
			box.value = 'c';
			await tick();
			expect(api.value).toBe('b');
		} finally {
			await dispose();
		}
	});

	it('ignores non-reactive sources after mount', async () => {
		const { api, dispose } = await mountPrevious(() => 5, 0);
		try {
			expect(api.value).toBe(0);
			await tick();
			expect(api.value).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('tracks previous object snapshots by reference', async () => {
		const box = createBox({ n: 1 });
		const { api, dispose } = await mountPrevious(() => box.value);
		try {
			const before = box.value;
			box.value = { n: 2 };
			await tick();
			// The previous snapshot is the exact (reactive) reference held
			// before the swap — not a copy.
			expect(api.value).toBe(before);
		} finally {
			await dispose();
		}
	});
});
