// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useDocumentVisibility } from './index.ts';

describe('useDocumentVisibility', () => {
	it('tracks visibility changes', async () => {
		const { api, dispose } = await mountUtil(() => useDocumentVisibility());
		try {
			expect(typeof api.value).toBe('string');
			Object.defineProperty(document, 'visibilityState', {
				configurable: true,
				value: 'hidden'
			});
			document.dispatchEvent(new window.Event('visibilitychange'));
			await tick();
			expect(api.value).toBe('hidden');
			Object.defineProperty(document, 'visibilityState', {
				configurable: true,
				value: 'visible'
			});
			document.dispatchEvent(new window.Event('visibilitychange'));
			await tick();
			expect(api.value).toBe('visible');
		} finally {
			await dispose();
		}
	});
});
