/**
 * Tests for `useArraySome`: matches, empty lists, reactivity.
 * Pure `$derived` logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArraySome } from './index.ts';

describe('useArraySome', () => {
	it('detects any match', () => {
		expect(useArraySome([1, 2, 3], (n) => n === 2).value).toBe(true);
		expect(useArraySome([1, 2, 3], (n) => n === 9).value).toBe(false);
	});

	it('is false for empty lists', () => {
		expect(useArraySome([], () => true).value).toBe(false);
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 3]);
		const some = useArraySome(
			() => box.value,
			(n) => n % 2 === 0
		);
		expect(some.value).toBe(false);
		box.value = [1, 4];
		expect(some.value).toBe(true);
	});
});
