// @vitest-environment jsdom
/**
 * Tests for `useMediaQuery`: matching, live changes, reactive queries,
 * SSR fallback, invalid queries, and disposal.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { useMediaQuery } from './index.ts';

const QUERY = '(prefers-color-scheme: dark)';

describe('useMediaQuery', () => {
	it('reports non-matching by default', async () => {
		const { api, dispose } = await mountUtil(() => useMediaQuery(QUERY));
		try {
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('follows live media changes', async () => {
		const { api, dispose } = await mountUtil(() => useMediaQuery(QUERY));
		try {
			setMediaMatches(QUERY, true);
			await tick();
			expect(api.value).toBe(true);
			setMediaMatches(QUERY, false);
			await tick();
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('re-subscribes when a reactive query changes', async () => {
		const query = createBox('(max-width: 100px)');
		const { api, dispose } = await mountUtil(() => useMediaQuery(() => query.value));
		try {
			setMediaMatches('(max-width: 100px)', true);
			await tick();
			expect(api.value).toBe(true);
			setMediaMatches('(min-width: 9999px)', true);
			query.value = '(min-width: 9999px)';
			await tick();
			expect(api.value).toBe(true);
			query.value = '(max-width: 100px)';
			await tick();
			expect(api.value).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('stops reacting after unmount', async () => {
		const { api, dispose } = await mountUtil(() => useMediaQuery(QUERY));
		setMediaMatches(QUERY, true);
		await tick();
		expect(api.value).toBe(true);
		await dispose();
		setMediaMatches(QUERY, false);
		await tick();
		expect(api.value).toBe(true);
	});

	it('falls back to ssrMatches without matchMedia', async () => {
		const original = window.matchMedia;
		Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
		try {
			const { api, dispose } = await mountUtil(() => useMediaQuery(QUERY, { ssrMatches: true }));
			try {
				expect(api.value).toBe(true);
			} finally {
				await dispose();
			}
		} finally {
			Object.defineProperty(window, 'matchMedia', { configurable: true, value: original });
		}
	});

	it('treats invalid queries as non-matching', async () => {
		const original = window.matchMedia;
		Object.defineProperty(window, 'matchMedia', {
			configurable: true,
			value: () => {
				throw new Error('bad query');
			}
		});
		try {
			const { api, dispose } = await mountUtil(() => useMediaQuery('(((invalid'));
			try {
				expect(api.value).toBe(false);
			} finally {
				await dispose();
			}
		} finally {
			Object.defineProperty(window, 'matchMedia', { configurable: true, value: original });
		}
	});
});
