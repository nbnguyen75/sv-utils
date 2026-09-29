import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayDifference } from './index.ts';

describe('useArrayDifference', () => {
	it('returns items missing from values by default', () => {
		expect(useArrayDifference([1, 2, 3], [2, 4]).value).toEqual([1, 3]);
	});

	it('returns both directions when symmetric', () => {
		expect(useArrayDifference([1, 2, 3], [2, 4], undefined, { symmetric: true }).value).toEqual([
			1, 3, 4
		]);
	});

	it('compares by key', () => {
		const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const values = [{ id: 2 }];
		expect(useArrayDifference(list, values, 'id').value).toEqual([{ id: 1 }, { id: 3 }]);
	});

	it('compares with a custom function', () => {
		const result = useArrayDifference([{ id: 1 }, { id: 2 }], [{ id: 2 }], (a, b) => a.id === b.id);
		expect(result.value).toEqual([{ id: 1 }]);
	});

	it('returns an empty array for identical lists', () => {
		expect(useArrayDifference([1, 2], [1, 2]).value).toEqual([]);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 2, 3]);
		const diff = useArrayDifference(() => box.value, [2]);
		expect(diff.value).toEqual([1, 3]);
		box.value = [2, 5];
		expect(diff.value).toEqual([5]);
	});

	it('reacts to values changes', () => {
		const values = createBox([2]);
		const diff = useArrayDifference([1, 2, 3], () => values.value);
		expect(diff.value).toEqual([1, 3]);
		values.value = [1, 2, 3];
		expect(diff.value).toEqual([]);
	});
});
