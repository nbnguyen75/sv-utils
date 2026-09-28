// @vitest-environment jsdom
/**
 * Tests for `useCycleList`: navigation, wraparound, options, setters,
 * and re-anchoring on list changes. Runs mounted (list sync in `$effect`).
 */
import { mount, tick, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

import Run from '../../../../test/fixtures/run.svelte';
import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useCycleList } from './index.ts';
import type { UseCycleListOptions, UseCycleListReturn } from './index.ts';

async function mountCycle<T>(list: () => T[], options?: UseCycleListOptions<T>) {
	let api: UseCycleListReturn<T> | undefined;
	const target = document.createElement('div');
	document.body.appendChild(target);
	const app = mount(Run, {
		props: {
			setup: () => {
				api = useCycleList(list, options);
			}
		},
		target
	});
	await tick();
	if (!api) throw new Error('useCycleList setup did not run');
	const cycle: UseCycleListReturn<T> = api;
	return {
		api: cycle,
		async dispose() {
			unmount(app);
			await tick();
			target.remove();
		}
	};
}

describe('useCycleList', () => {
	it('starts at the first item and wraps on next/prev', async () => {
		const { api, dispose } = await mountCycle(() => ['a', 'b', 'c']);
		try {
			expect(api.value).toBe('a');
			expect(api.index).toBe(0);
			expect(api.next()).toBe('b');
			expect(api.next()).toBe('c');
			expect(api.next()).toBe('a');
			expect(api.prev()).toBe('c');
			expect(api.prev(2)).toBe('a');
		} finally {
			await dispose();
		}
	});

	it('go jumps with wrapping, including negatives', async () => {
		const { api, dispose } = await mountCycle(() => ['a', 'b', 'c']);
		try {
			expect(api.go(2)).toBe('c');
			expect(api.go(5)).toBe('c');
			expect(api.go(-1)).toBe('c');
			expect(api.go(-4)).toBe('c');
		} finally {
			await dispose();
		}
	});

	it('honors initialValue, fallbackIndex, and getIndexOf', async () => {
		const list = ['a', 'b', 'c'];
		const first = await mountCycle(() => list, { initialValue: 'b' });
		try {
			expect(first.api.value).toBe('b');
			expect(first.api.index).toBe(1);
		} finally {
			await first.dispose();
		}

		const second = await mountCycle(() => list, { initialValue: 'zzz' });
		try {
			expect(second.api.index).toBe(0);
		} finally {
			await second.dispose();
		}

		const third = await mountCycle(() => [{ id: 1 }, { id: 2 }], {
			getIndexOf: (value, items) => items.findIndex((item) => item.id === value.id)
		});
		try {
			expect(third.api.index).toBe(0);
			third.api.next();
			expect(third.api.value).toEqual({ id: 2 });
			expect(third.api.index).toBe(1);
		} finally {
			await third.dispose();
		}
	});

	it('writes through the value setter', async () => {
		const { api, dispose } = await mountCycle(() => ['a', 'b', 'c']);
		try {
			api.value = 'c';
			expect(api.value).toBe('c');
			expect(api.index).toBe(2);
			expect(api.next()).toBe('a');
		} finally {
			await dispose();
		}
	});

	it('re-anchors when the list identity changes', async () => {
		const box = createBox(['a', 'b', 'c']);
		const { api, dispose } = await mountCycle(() => box.value);
		try {
			api.next();
			expect(api.value).toBe('b');
			box.value = ['x', 'y'];
			await tick();
			// 'b' is gone: falls back to index 0 of the new list.
			expect(api.value).toBe('x');
			expect(api.index).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('handles an empty list without throwing', async () => {
		const { api, dispose } = await mountCycle(() => [] as string[]);
		try {
			expect(api.index).toBe(-1);
			expect(api.next()).toBe(undefined);
			expect(api.prev()).toBe(undefined);
		} finally {
			await dispose();
		}
	});
});
