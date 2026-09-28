/**
 * Tests for `useArrayFind`: first match, misses, reactivity.
 * Pure `$derived` logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayFind } from './index.ts';

const isEven = (n: number) => n % 2 === 0;

describe('useArrayFind', () => {
	it('returns the first match', () => {
		expect(useArrayFind([1, 3, 4, 6], isEven).value).toBe(4);
	});

	it('returns undefined without a match', () => {
		expect(useArrayFind([1, 3], isEven).value).toBeUndefined();
	});

	it('reacts to source changes', () => {
		const box = createBox([1, 3]);
		const found = useArrayFind(() => box.value, isEven);
		expect(found.value).toBeUndefined();
		box.value = [1, 8];
		expect(found.value).toBe(8);
	});
});
