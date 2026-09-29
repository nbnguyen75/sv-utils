// @vitest-environment jsdom
/**
 * Tests for `usePreferredDark`: OS dark-theme preference tracking.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { usePreferredDark } from './index.ts';

describe('usePreferredDark', () => {
	it('reflects the dark color-scheme query', async () => {
		const { api, dispose } = await mountUtil(() => usePreferredDark());
		try {
			expect(api.value).toBe(false);
			setMediaMatches('(prefers-color-scheme: dark)', true);
			await tick();
			expect(api.value).toBe(true);
		} finally {
			await dispose();
		}
	});
});
