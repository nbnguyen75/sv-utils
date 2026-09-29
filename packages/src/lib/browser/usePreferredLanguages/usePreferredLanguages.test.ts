// @vitest-environment jsdom
/**
 * Tests for `usePreferredLanguages`: defaults, live updates, disposal.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { usePreferredLanguages } from './index.ts';

function setLanguages(tags: readonly string[]) {
	Object.defineProperty(window.navigator, 'languages', { configurable: true, value: tags });
}

describe('usePreferredLanguages', () => {
	it('reads the current languages and follows changes', async () => {
		setLanguages(['en-US', 'en']);
		const { api, dispose } = await mountUtil(() => usePreferredLanguages());
		try {
			expect(api.value).toEqual(['en-US', 'en']);
			setLanguages(['fr', 'en']);
			window.dispatchEvent(new window.Event('languagechange'));
			await tick();
			expect(api.value).toEqual(['fr', 'en']);
		} finally {
			await dispose();
		}
	});

	it('stops reacting after unmount', async () => {
		setLanguages(['en']);
		const { api, dispose } = await mountUtil(() => usePreferredLanguages());
		await dispose();
		setLanguages(['de']);
		window.dispatchEvent(new window.Event('languagechange'));
		await tick();
		expect(api.value).toEqual(['en']);
	});
});
