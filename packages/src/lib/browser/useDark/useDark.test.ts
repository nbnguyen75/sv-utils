// @vitest-environment jsdom
/**
 * Tests for `useDark`: OS preference, persistence, toggle/setMode,
 * DOM sync, custom options, and listener disposal on unmount.
 */
import { mount, tick, unmount } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';

import Run from '../../../../test/fixtures/run.svelte';
import { setMediaMatches } from '../../../../test/setup.ts';
import { useDark } from './index.ts';
import type { UseDarkOptions, UseDarkReturn } from './index.ts';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

beforeEach(() => {
	window.localStorage.clear();
	document.documentElement.classList.remove('dark');
	document.documentElement.removeAttribute('data-theme');
});

async function mountDark(opts?: UseDarkOptions) {
	let api: UseDarkReturn | undefined;
	const target = document.createElement('div');
	document.body.appendChild(target);
	const app = mount(Run, {
		props: {
			setup: () => {
				api = useDark(opts);
			}
		},
		target
	});
	await tick();
	if (!api) throw new Error('useDark setup did not run');
	const dark: UseDarkReturn = api;
	return {
		api: dark,
		async dispose() {
			unmount(app);
			await tick();
			target.remove();
		}
	};
}

describe('useDark', () => {
	it('defaults to light with empty storage and light OS preference', async () => {
		const { api, dispose } = await mountDark({ storageKey: 'sv-test-dark-default' });
		try {
			expect(api.value).toBe(false);
			expect(document.documentElement.classList.contains('dark')).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('follows a dark OS preference in auto mode', async () => {
		setMediaMatches(MEDIA_QUERY, true);
		const { api, dispose } = await mountDark({ storageKey: 'sv-test-dark-os' });
		try {
			expect(api.value).toBe(true);
			expect(document.documentElement.classList.contains('dark')).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('reacts to OS preference changes while in auto mode', async () => {
		const { api, dispose } = await mountDark({ storageKey: 'sv-test-dark-live' });
		try {
			expect(api.value).toBe(false);
			setMediaMatches(MEDIA_QUERY, true);
			await tick();
			expect(api.value).toBe(true);
			expect(document.documentElement.classList.contains('dark')).toBe(true);
			setMediaMatches(MEDIA_QUERY, false);
			await tick();
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('toggle persists explicit light/dark and ignores OS changes after', async () => {
		const key = 'sv-test-dark-toggle';
		const { api, dispose } = await mountDark({ storageKey: key });
		try {
			api.toggle();
			await tick();
			expect(api.value).toBe(true);
			expect(window.localStorage.getItem(key)).toBe('dark');
			setMediaMatches(MEDIA_QUERY, false);
			await tick();
			expect(api.value).toBe(true);
			api.toggle();
			await tick();
			expect(api.value).toBe(false);
			expect(window.localStorage.getItem(key)).toBe('light');
		} finally {
			await dispose();
		}
	});

	it('setMode switches modes and auto returns to OS-driven', async () => {
		const key = 'sv-test-dark-mode';
		const { api, dispose } = await mountDark({ storageKey: key });
		try {
			api.setMode('dark');
			await tick();
			expect(api.value).toBe(true);
			api.setMode('light');
			await tick();
			expect(api.value).toBe(false);
			setMediaMatches(MEDIA_QUERY, true);
			await tick();
			expect(api.value).toBe(false);
			api.setMode('auto');
			await tick();
			expect(api.value).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('restores the persisted mode on mount', async () => {
		const key = 'sv-test-dark-restore';
		window.localStorage.setItem(key, 'dark');
		const { api, dispose } = await mountDark({ storageKey: key });
		try {
			expect(api.value).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('writes a custom attribute instead of the dark class', async () => {
		const { api, dispose } = await mountDark({
			attribute: 'data-theme',
			storageKey: 'sv-test-dark-attr'
		});
		try {
			expect(document.documentElement.getAttribute('data-theme')).toBe('light');
			api.toggle();
			await tick();
			expect(api.value).toBe(true);
			expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
			expect(document.documentElement.classList.contains('dark')).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('stops reacting to OS changes after unmount', async () => {
		setMediaMatches(MEDIA_QUERY, true);
		const { api, dispose } = await mountDark({ storageKey: 'sv-test-dark-dispose' });
		expect(api.value).toBe(true);
		await dispose();
		setMediaMatches(MEDIA_QUERY, false);
		await tick();
		expect(api.value).toBe(true);
	});
});
