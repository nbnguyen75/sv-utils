// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { usePreferredContrast } from './index.ts';

describe('usePreferredContrast', () => {
	it('prefers more over less over custom', async () => {
		const { api, dispose } = await mountUtil(() => usePreferredContrast());
		try {
			expect(api.value).toBe('no-preference');
			setMediaMatches('(prefers-contrast: custom)', true);
			await tick();
			expect(api.value).toBe('custom');
			setMediaMatches('(prefers-contrast: less)', true);
			await tick();
			expect(api.value).toBe('less');
			setMediaMatches('(prefers-contrast: more)', true);
			await tick();
			expect(api.value).toBe('more');
		} finally {
			await dispose();
		}
	});
});
