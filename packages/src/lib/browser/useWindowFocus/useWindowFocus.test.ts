// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useWindowFocus } from './index.ts';

describe('useWindowFocus', () => {
	it('tracks blur and focus', async () => {
		const { api, dispose } = await mountUtil(() => useWindowFocus());
		try {
			expect(typeof api.value).toBe('boolean');
			window.dispatchEvent(new window.Event('blur'));
			await tick();
			expect(api.value).toBe(false);
			window.dispatchEvent(new window.Event('focus'));
			await tick();
			expect(api.value).toBe(true);
		} finally {
			await dispose();
		}
	});
});
