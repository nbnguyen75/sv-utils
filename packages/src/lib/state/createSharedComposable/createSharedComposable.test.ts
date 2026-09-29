// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { createSharedComposable } from './index.ts';

describe('createSharedComposable', () => {
	it('shares one instance across client calls', async () => {
		const factory = vi.fn((_name: string) => ({ created: true }));
		const useShared = createSharedComposable(factory);
		const first = useShared('first');
		const second = useShared('second');
		expect(factory).toHaveBeenCalledTimes(1);
		expect(factory).toHaveBeenCalledWith('first');
		expect(second).toBe(first);
	});
});
