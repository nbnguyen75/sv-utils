// @vitest-environment jsdom
/**
 * Tests for `useFavicon`: initial application, reactive updates, setter
 * writes, custom rel/base, and link reuse.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useFavicon } from './index.ts';

function links(rel = 'icon'): HTMLLinkElement[] {
	return Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel*="${rel}"]`));
}

function clearLinks() {
	for (const link of document.head.querySelectorAll('link[rel*="icon"]')) link.remove();
}

describe('useFavicon', () => {
	it('applies the initial icon on mount', async () => {
		clearLinks();
		const { api, dispose } = await mountUtil(() => useFavicon('app.png'));
		try {
			expect(api.value).toBe('app.png');
			const [link] = links();
			expect(link?.href.endsWith('/app.png')).toBe(true);
			expect(link?.rel).toBe('icon');
			expect(link?.type).toBe('image/png');
		} finally {
			await dispose();
			clearLinks();
		}
	});

	it('updates the href when a reactive icon changes', async () => {
		clearLinks();
		const box = createBox('one.ico');
		const { api, dispose } = await mountUtil(() => useFavicon(() => box.value));
		try {
			expect(links().length).toBe(1);
			box.value = 'two.ico';
			await tick();
			expect(api.value).toBe('two.ico');
			expect(links().length).toBe(1);
			expect(links()[0]?.href.endsWith('/two.ico')).toBe(true);
		} finally {
			await dispose();
			clearLinks();
		}
	});

	it('writes through the setter and ignores nullish values', async () => {
		clearLinks();
		const { api, dispose } = await mountUtil(() => useFavicon('a.png'));
		try {
			api.value = 'b.svg';
			expect(links()[0]?.href.endsWith('/b.svg')).toBe(true);
			// Existing links keep their original type; only href updates.
			expect(links()[0]?.type).toBe('image/png');
			api.value = null;
			expect(api.value).toBeNull();
			expect(links()[0]?.href.endsWith('/b.svg')).toBe(true);
		} finally {
			await dispose();
			clearLinks();
		}
	});

	it('honors custom rel and baseUrl', async () => {
		clearLinks();
		const { dispose } = await mountUtil(() =>
			useFavicon('icon.png', { baseUrl: '/assets/', rel: 'shortcut icon' })
		);
		try {
			const [link] = links('shortcut icon');
			expect(link?.href.endsWith('/assets/icon.png')).toBe(true);
		} finally {
			await dispose();
			clearLinks();
		}
	});
});
