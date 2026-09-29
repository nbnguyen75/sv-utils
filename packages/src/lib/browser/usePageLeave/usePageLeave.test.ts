// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { usePageLeave } from './index.ts';

describe('usePageLeave', () => {
	it('detects pointer exits and entries', async () => {
		const { api, dispose } = await mountUtil(() => usePageLeave());
		try {
			expect(api.value).toBe(false);
			window.dispatchEvent(new window.MouseEvent('mouseout', { relatedTarget: null }));
			await tick();
			expect(api.value).toBe(true);
			const target = document.createElement('div');
			document.body.appendChild(target);
			try {
				window.dispatchEvent(new window.MouseEvent('mouseout', { relatedTarget: target }));
				await tick();
				expect(api.value).toBe(false);
				document.dispatchEvent(new window.MouseEvent('mouseenter', { relatedTarget: target }));
				await tick();
				expect(api.value).toBe(false);
			} finally {
				target.remove();
			}
		} finally {
			await dispose();
		}
	});
});
