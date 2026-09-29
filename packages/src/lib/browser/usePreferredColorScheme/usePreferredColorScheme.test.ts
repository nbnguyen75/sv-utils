// @vitest-environment jsdom
/**
 * Tests for `usePreferredColorScheme`: dark/light/no-preference resolution.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { usePreferredColorScheme } from './index.ts';

describe('usePreferredColorScheme', () => {
	it('resolves dark, light, and no-preference', async () => {
		const { api, dispose } = await mountUtil(() => usePreferredColorScheme());
		try {
			expect(api.value).toBe('no-preference');
			setMediaMatches('(prefers-color-scheme: light)', true);
			await tick();
			expect(api.value).toBe('light');
			setMediaMatches('(prefers-color-scheme: dark)', true);
			await tick();
			expect(api.value).toBe('dark');
			setMediaMatches('(prefers-color-scheme: dark)', false);
			setMediaMatches('(prefers-color-scheme: light)', false);
			await tick();
			expect(api.value).toBe('no-preference');
		} finally {
			await dispose();
		}
	});
});
