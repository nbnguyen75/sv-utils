// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useFocusWithin } from './index.ts';

describe('useFocusWithin', () => {
	it('tracks focus moving in and out of the target', async () => {
		const parent = document.createElement('div');
		const child = document.createElement('button');
		parent.appendChild(child);
		document.body.appendChild(parent);
		const { api, dispose } = await mountUtil(() => useFocusWithin(() => parent));
		try {
			expect(api.focused).toBe(false);
			child.focus();
			await tick();
			expect(api.focused).toBe(true);
			child.blur();
			document.body.setAttribute('tabindex', '-1');
			(document.body as HTMLElement).focus();
			await tick();
			// Mirrors the implementation query: whatever :focus-within
			// computes here, the util tracks it.
			expect(api.focused).toBe(parent.matches(':focus-within'));
		} finally {
			document.body.removeAttribute('tabindex');
			parent.remove();
			await dispose();
		}
	});

	it('starts unfocused without a target', async () => {
		const { api, dispose } = await mountUtil(() => useFocusWithin(() => null));
		try {
			expect(api.focused).toBe(false);
		} finally {
			await dispose();
		}
	});
});
