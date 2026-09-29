/**
 * Tests for `createGlobalState`: lazy singleton, argument passthrough,
 * and instance stability. Framework-free — node environment.
 */
import { describe, expect, it, vi } from 'vitest';

import { createGlobalState } from './index.ts';

describe('createGlobalState', () => {
	it('builds lazily on first call and reuses after', () => {
		const factory = vi.fn((name: string) => ({ name }));
		const useState = createGlobalState(factory);
		expect(factory).not.toHaveBeenCalled();
		const first = useState('a');
		expect(factory).toHaveBeenCalledTimes(1);
		expect(useState('ignored')).toBe(first);
		expect(first).toEqual({ name: 'a' });
	});

	it('keeps instances isolated per factory', () => {
		const useA = createGlobalState(() => ({ id: 'a' }));
		const useB = createGlobalState(() => ({ id: 'b' }));
		expect(useA()).not.toBe(useB());
	});
});
