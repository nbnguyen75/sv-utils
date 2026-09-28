// @vitest-environment jsdom
/**
 * Tests for `usePrevious`: initial value, change tracking, and
 * non-reactive sources. Runs mounted (the source is sampled in `$effect`).
 */
import { mount, tick, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

import Run from '../../../../test/fixtures/run.svelte';
import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { usePrevious } from './index.ts';
import type { UsePreviousReturn } from './index.ts';

async function mountPrevious<T>(source: () => T, initialValue?: T) {
	let api: UsePreviousReturn<T | undefined> | undefined;
	const target = document.createElement('div');
	document.body.appendChild(target);
	const app = mount(Run, {
		props: {
			setup: () => {
				api = usePrevious(source, initialValue as T);
			}
		},
		target
	});
	await tick();
	if (!api) throw new Error('usePrevious setup did not run');
	const previous: UsePreviousReturn<T | undefined> = api;
	return {
		api: previous,
		async dispose() {
			unmount(app);
			await tick();
			target.remove();
		}
	};
}

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
