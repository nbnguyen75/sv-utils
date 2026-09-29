import { describe, expect, it, vi } from 'vitest';

import { createSharedComposable } from '../createSharedComposable/index.ts';

describe('createSharedComposable (node / SSR)', () => {
	it('returns fresh instances without browser globals', () => {
		expect(typeof window).toBe('undefined');
		const factory = vi.fn(() => ({}));
		const useShared = createSharedComposable(factory);
		expect(useShared()).not.toBe(useShared());
		expect(factory).toHaveBeenCalledTimes(2);
	});
});
