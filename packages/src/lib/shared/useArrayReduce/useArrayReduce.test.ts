/**
 * Tests for `useArrayReduce`: sums, typed reductions, getter initials,
 * index args, empty-list throw, reactivity. Pure `$derived` logic — node.
 */
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayReduce } from './index.ts';

describe('useArrayReduce', () => {
	it('reduces without an initial value', () => {
		expect(useArrayReduce([1, 2, 3, 4], (sum, n) => sum + n).value).toBe(10);
	});

	it('reduces with an initial value', () => {
		expect(useArrayReduce([1, 2, 3], (sum, n) => sum + n, 100).value).toBe(106);
	});

	it('reduces into a different type', () => {
		const result = useArrayReduce([1, 2, 3], (acc: string, n) => `${acc}${n}`, '');
		expect(result.value).toBe('123');
	});

	it('resolves getter initial values', () => {
		const box = createBox(10);
		const reduced = useArrayReduce(
			[1, 2],
			(sum, n) => sum + n,
			() => box.value
		);
		expect(reduced.value).toBe(13);
		box.value = 100;
		expect(reduced.value).toBe(103);
	});

	it('passes the index to the reducer (native: from 1 without initial)', () => {
		const indices: number[] = [];
		const total = useArrayReduce([5, 6], (sum, n, index) => {
			indices.push(index);
			return sum + n;
		}).value;
		expect(total).toBe(11);
		expect(indices).toEqual([1]);
	});

	it('throws on empty lists without an initial value (native)', () => {
		expect(() => useArrayReduce([], (sum: number, n: number) => sum + n).value).toThrow(TypeError);
	});

	it('returns the initial for empty lists with one', () => {
		expect(useArrayReduce([], (sum: number, n: number) => sum + n, 7).value).toBe(7);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 2]);
		const reduced = useArrayReduce(
			() => box.value,
			(sum, n) => sum + n,
			0
		);
		expect(reduced.value).toBe(3);
		box.value = [1, 2, 3];
		expect(reduced.value).toBe(6);
	});
});
