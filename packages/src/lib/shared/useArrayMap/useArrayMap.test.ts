import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayMap } from './index.ts';

describe('useArrayMap', () => {
	it('maps each element', () => {
		expect(useArrayMap([1, 2, 3], (n) => n * 2).value).toEqual([2, 4, 6]);
	});

	it('passes index and array to the callback', () => {
		const seen: Array<[number, number, readonly number[]]> = [];
		const result = useArrayMap([10, 20], (element, index, array) => {
			seen.push([element, index, array]);
			return element + index;
		});
		expect(result.value).toEqual([10, 21]);
		expect(seen[0]?.[1]).toBe(0);
		expect(seen[1]?.[2]).toEqual([10, 20]);
	});

	it('maps an empty list to an empty list', () => {
		expect(useArrayMap([], (n: number) => n).value).toEqual([]);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 2]);
		const mapped = useArrayMap(
			() => box.value,
			(n) => n + 1
		);
		expect(mapped.value).toEqual([2, 3]);
		box.value = [1, 2, 3];
		expect(mapped.value).toEqual([2, 3, 4]);
	});

	it('does not mutate the source', () => {
		const source = [1, 2];
		useArrayMap(source, (n) => n * 10);
		expect(source).toEqual([1, 2]);
	});
});
