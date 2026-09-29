// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { usePreferredReducedTransparency } from './index.ts';

describe('usePreferredReducedTransparency', () => {
	it('reflects the reduce query', async () => {
		const { api, dispose } = await mountUtil(() => usePreferredReducedTransparency());
		try {
			expect(api.value).toBe('no-preference');
			setMediaMatches('(prefers-reduced-transparency: reduce)', true);
			await tick();
			expect(api.value).toBe('reduce');
		} finally {
			await dispose();
		}
	});
});
