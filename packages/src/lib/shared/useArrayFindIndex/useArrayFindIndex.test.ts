import { describe, expect, it } from 'vitest';

import { useArrayFindIndex } from './index.ts';

const isEven = (n: number) => n % 2 === 0;

describe('useArrayFindIndex', () => {
	it('returns the first matching index', () => {
		expect(useArrayFindIndex([1, 3, 4], isEven).value).toBe(2);
	});

	it('returns -1 without a match', () => {
		expect(useArrayFindIndex([1, 3], isEven).value).toBe(-1);
	});

	it('returns -1 for empty lists', () => {
		expect(useArrayFindIndex([], isEven).value).toBe(-1);
	});
});
