/**
 * Tests for the shared `MaybeGetter` pattern. Pure logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { resolveGetter } from './index.ts';
import type { MaybeGetter } from './index.ts';

describe('getter', () => {
	it('returns plain values as-is', () => {
		expect(resolveGetter(1)).toBe(1);
		expect(resolveGetter('a')).toBe('a');
		expect(resolveGetter(null)).toBeNull();
		expect(resolveGetter(undefined)).toBeUndefined();
		const object = { n: 1 };
		expect(resolveGetter(object)).toBe(object);
	});

	it('calls getter functions on every read', () => {
		let count = 0;
		const getter: MaybeGetter<number> = () => {
			count += 1;
			return count;
		};
		expect(resolveGetter(getter)).toBe(1);
		expect(resolveGetter(getter)).toBe(2);
	});
});
