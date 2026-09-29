// @vitest-environment jsdom
/**
 * Tests for `usePreferredReducedMotion`: reduce query tracking.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { usePreferredReducedMotion } from './index.ts';

describe('usePreferredReducedMotion', () => {
	it('reflects the reduce query', async () => {
		const { api, dispose } = await mountUtil(() => usePreferredReducedMotion());
		try {
			expect(api.value).toBe('no-preference');
			setMediaMatches('(prefers-reduced-motion: reduce)', true);
			await tick();
			expect(api.value).toBe('reduce');
		} finally {
			await dispose();
		}
	});
});
