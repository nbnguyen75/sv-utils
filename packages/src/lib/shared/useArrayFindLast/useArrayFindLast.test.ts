import { describe, expect, it } from 'vitest';

import { useArrayFindLast } from './index.ts';

const isEven = (n: number) => n % 2 === 0;

describe('useArrayFindLast', () => {
	it('returns the last match', () => {
		expect(useArrayFindLast([2, 1, 4, 3], isEven).value).toBe(4);
	});

	it('returns undefined without a match', () => {
		expect(useArrayFindLast([1, 3], isEven).value).toBeUndefined();
	});

	it('scans from the end', () => {
		const order: number[] = [];
		const found = useArrayFindLast([1, 2, 3], (n) => {
			order.push(n);
			return false;
		});
		expect(found.value).toBeUndefined();
		expect(order).toEqual([3, 2, 1]);
	});
});
