// @vitest-environment jsdom
/**
 * Tests for `useActiveElement`: focus tracking, blur semantics,
 * removal tracking, and disposal.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useActiveElement } from './index.ts';

describe('useActiveElement', () => {
	it('tracks the focused element', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const { api, dispose } = await mountUtil(() => useActiveElement());
		try {
			button.focus();
			await tick();
			expect(api.value).toBe(button);
			button.blur();
			await tick();
			expect(api.value).not.toBe(button);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('re-resolves when the focused node is removed with triggerOnRemoval', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const { api, dispose } = await mountUtil(() => useActiveElement({ triggerOnRemoval: true }));
		try {
			button.focus();
			await tick();
			expect(api.value).toBe(button);
			button.remove();
			await tick();
			await tick();
			expect(api.value).not.toBe(button);
		} finally {
			await dispose();
		}
	});

	it('stops reacting after unmount', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const { api, dispose } = await mountUtil(() => useActiveElement());
		button.focus();
		await tick();
		expect(api.value).toBe(button);
		await dispose();
		button.blur();
		document.body.focus?.();
		button.remove();
		await tick();
		expect(api.value).toBe(button);
	});
});
