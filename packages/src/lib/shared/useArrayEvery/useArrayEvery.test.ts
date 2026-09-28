/**
 * Tests for `useArrayEvery`: universal match, empty lists, reactivity.
 * Pure `$derived` logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayEvery } from './index.ts';

describe('useArrayEvery', () => {
	it('requires all matches', () => {
		expect(useArrayEvery([2, 4], (n) => n % 2 === 0).value).toBe(true);
		expect(useArrayEvery([2, 3], (n) => n % 2 === 0).value).toBe(false);
	});

	it('is true for empty lists', () => {
		expect(useArrayEvery([], () => false).value).toBe(true);
	});

	it('reacts to source changes', () => {
		const box = createBox([2, 4]);
		const every = useArrayEvery(
			() => box.value,
			(n) => n % 2 === 0
		);
		expect(every.value).toBe(true);
		box.value = [2, 5];
		expect(every.value).toBe(false);
	});
});
