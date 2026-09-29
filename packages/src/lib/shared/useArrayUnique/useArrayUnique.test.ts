import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayUnique } from './index.ts';

describe('useArrayUnique', () => {
	it('dedupes primitives keeping first occurrences', () => {
		expect(useArrayUnique([1, 2, 1, 3, 2]).value).toEqual([1, 2, 3]);
	});

	it('dedupes NaN like Set (SameValueZero)', () => {
		expect(useArrayUnique([Number.NaN, Number.NaN, 1]).value).toEqual([Number.NaN, 1]);
	});

	it('dedupes by reference for objects by default', () => {
		const shared = { id: 1 };
		expect(useArrayUnique([shared, { id: 1 }, shared]).value).toEqual([shared, { id: 1 }]);
	});

	it('dedupes with a custom comparator', () => {
		const result = useArrayUnique([{ id: 1 }, { id: 1 }, { id: 2 }], (a, b) => a.id === b.id);
		expect(result.value).toEqual([{ id: 1 }, { id: 2 }]);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 1, 2]);
		const unique = useArrayUnique(() => box.value);
		expect(unique.value).toEqual([1, 2]);
		box.value = [2, 2, 3];
		expect(unique.value).toEqual([2, 3]);
	});
});
