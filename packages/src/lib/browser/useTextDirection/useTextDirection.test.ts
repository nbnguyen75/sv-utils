// @vitest-environment jsdom
/**
 * Tests for `useTextDirection`: defaults, attribute reads, setter writes,
 * observation, and missing elements.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useTextDirection } from './index.ts';

describe('useTextDirection', () => {
	it('defaults to the initial value without a dir attribute', async () => {
		document.documentElement.removeAttribute('dir');
		const { api, dispose } = await mountUtil(() => useTextDirection());
		try {
			expect(api.value).toBe('ltr');
		} finally {
			await dispose();
			document.documentElement.removeAttribute('dir');
		}
	});

	it('reads the existing attribute on mount', async () => {
		document.documentElement.setAttribute('dir', 'rtl');
		const { api, dispose } = await mountUtil(() => useTextDirection());
		try {
			expect(api.value).toBe('rtl');
		} finally {
			await dispose();
			document.documentElement.removeAttribute('dir');
		}
	});

	it('writes through the setter', async () => {
		document.documentElement.removeAttribute('dir');
		const { api, dispose } = await mountUtil(() => useTextDirection());
		try {
			api.value = 'rtl';
			expect(document.documentElement.getAttribute('dir')).toBe('rtl');
			expect(api.value).toBe('rtl');
		} finally {
			await dispose();
			document.documentElement.removeAttribute('dir');
		}
	});

	it('follows attribute changes with observe:true', async () => {
		document.documentElement.setAttribute('dir', 'ltr');
		const { api, dispose } = await mountUtil(() => useTextDirection({ observe: true }));
		try {
			expect(api.value).toBe('ltr');
			document.documentElement.setAttribute('dir', 'rtl');
			await tick();
			await tick();
			expect(api.value).toBe('rtl');
		} finally {
			await dispose();
			document.documentElement.removeAttribute('dir');
		}
	});

	it('tolerates a missing selector target', async () => {
		const { api, dispose } = await mountUtil(() =>
			useTextDirection({ selector: '#no-such-element', initialValue: 'rtl' })
		);
		try {
			expect(api.value).toBe('rtl');
			api.value = 'ltr';
			expect(api.value).toBe('ltr');
		} finally {
			await dispose();
		}
	});
});
