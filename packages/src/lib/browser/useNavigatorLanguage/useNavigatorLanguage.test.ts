// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useNavigatorLanguage } from './index.ts';

describe('useNavigatorLanguage', () => {
	it('reports support and the current language', async () => {
		Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'en-US' });
		const { api, dispose } = await mountUtil(() => useNavigatorLanguage());
		try {
			expect(api.isSupported).toBe(true);
			expect(api.language).toBe('en-US');
			Object.defineProperty(window.navigator, 'language', {
				configurable: true,
				value: 'fr-FR'
			});
			window.dispatchEvent(new window.Event('languagechange'));
			await tick();
			expect(api.language).toBe('fr-FR');
		} finally {
			await dispose();
		}
	});
});
