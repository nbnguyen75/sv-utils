import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayFilter } from './index.ts';

describe('useArrayFilter', () => {
	it('keeps matching elements', () => {
		expect(useArrayFilter([1, 2, 3, 4], (n) => n % 2 === 0).value).toEqual([2, 4]);
	});

	it('returns an empty array when nothing matches', () => {
		expect(useArrayFilter([1, 3], (n) => n % 2 === 0).value).toEqual([]);
	});

	it('treats truthy returns as matches', () => {
		expect(useArrayFilter(['a', '', 'b'], (s) => s).value).toEqual(['a', 'b']);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 2, 3]);
		const filtered = useArrayFilter(
			() => box.value,
			(n) => n > 1
		);
		expect(filtered.value).toEqual([2, 3]);
		box.value = [0, 5];
		expect(filtered.value).toEqual([5]);
	});
});
