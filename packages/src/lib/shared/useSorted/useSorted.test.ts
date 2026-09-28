// @vitest-environment jsdom
/**
 * Tests for `useSorted`: default/custom/sortFn ordering, overload shapes,
 * non-mutation, reactivity, and in-place `dirty` mode (mounted).
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountSetup } from '../../../../test/fixtures/mount.ts';
import { useSorted } from './index.ts';

describe('useSorted copy mode', () => {
	it('sorts numbers ascending by default', () => {
		expect(useSorted([3, 1, 2]).value).toEqual([1, 2, 3]);
	});

	it('does not mutate the source', () => {
		const source = [3, 1, 2];
		useSorted(source);
		expect(source).toEqual([3, 1, 2]);
	});

	it('accepts a compare function directly', () => {
		expect(useSorted([1, 2, 3], (a, b) => b - a).value).toEqual([3, 2, 1]);
	});

	it('accepts compareFn inside options', () => {
		expect(useSorted(['b', 'a', 'c'], { compareFn: (a, b) => a.localeCompare(b) }).value).toEqual([
			'a',
			'b',
			'c'
		]);
	});

	it('accepts compareFn plus options', () => {
		const result = useSorted([3, 1, 2], (a, b) => a - b, {});
		expect(result.value).toEqual([1, 2, 3]);
	});

	it('supports a custom sortFn', () => {
		const result = useSorted([3, 1, 2], {
			sortFn: (arr, compare) => [...arr].sort(compare).reverse()
		});
		expect(result.value).toEqual([3, 2, 1]);
	});

	it('sorts objects with a custom compareFn', () => {
		const users = [{ age: 30 }, { age: 20 }];
		const sorted = useSorted(users, (a, b) => a.age - b.age);
		expect(sorted.value).toEqual([{ age: 20 }, { age: 30 }]);
		expect(users).toEqual([{ age: 30 }, { age: 20 }]);
	});

	it('reacts to source changes', () => {
		const box = createBox([3, 1]);
		const sorted = useSorted(() => box.value);
		expect(sorted.value).toEqual([1, 3]);
		box.value = [5, 4, 6];
		expect(sorted.value).toEqual([4, 5, 6]);
	});
});

describe('useSorted dirty mode', () => {
	it('sorts the source array in place', async () => {
		const box = createBox([3, 1, 2]);
		let seen: number[] | undefined;
		const { dispose } = await mountSetup(() => {
			seen = useSorted(() => box.value, { dirty: true }).value;
		});
		try {
			expect(box.value).toEqual([1, 2, 3]);
			expect(seen).toEqual([1, 2, 3]);
			box.value.push(0);
			box.value = [...box.value];
			await tick();
			expect(box.value).toEqual([0, 1, 2, 3]);
		} finally {
			await dispose();
		}
	});
});
