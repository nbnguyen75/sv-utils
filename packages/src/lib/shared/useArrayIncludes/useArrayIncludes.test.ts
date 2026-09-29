import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayIncludes } from './index.ts';

describe('useArrayIncludes', () => {
	it('matches by strict equality by default', () => {
		expect(useArrayIncludes([1, 2, 3], 2).value).toBe(true);
		expect(useArrayIncludes([1, 2, 3], 9).value).toBe(false);
	});

	it('resolves getter values', () => {
		const box = createBox(2);
		const included = useArrayIncludes([1, 2, 3], () => box.value);
		expect(included.value).toBe(true);
		box.value = 9;
		expect(included.value).toBe(false);
	});

	it('matches with a comparator function', () => {
		const result = useArrayIncludes([{ id: 1 }, { id: 2 }], { id: 2 }, (a, b) => a.id === b.id);
		expect(result.value).toBe(true);
		const missing = useArrayIncludes([{ id: 1 }], { id: 2 }, (a, b) => a.id === b.id);
		expect(missing.value).toBe(false);
	});

	it('matches by element key against the key value', () => {
		const users = [{ id: 1 }, { id: 2 }];
		expect(useArrayIncludes(users, 2, 'id').value).toBe(true);
		expect(useArrayIncludes(users, 3, 'id').value).toBe(false);
	});

	it('honors fromIndex via options', () => {
		expect(useArrayIncludes([1, 2, 1], 1, { fromIndex: 1 }).value).toBe(true);
		expect(useArrayIncludes([1, 2, 3], 1, { fromIndex: 1 }).value).toBe(false);
	});

	it('accepts a comparator inside options', () => {
		const result = useArrayIncludes(
			[{ id: 1 }],
			{ id: 1 },
			{ comparator: (a, b) => a.id === b.id }
		);
		expect(result.value).toBe(true);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 2]);
		const included = useArrayIncludes(() => box.value, 3);
		expect(included.value).toBe(false);
		box.value = [3, 4];
		expect(included.value).toBe(true);
	});
});
