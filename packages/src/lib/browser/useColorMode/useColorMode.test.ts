// @vitest-environment jsdom
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { useColorMode } from './index.ts';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const KEY = 'sv-color-scheme';

beforeEach(() => {
	window.localStorage.clear();
	document.documentElement.removeAttribute('class');
	document.documentElement.removeAttribute('data-theme');
	setMediaMatches(DARK_QUERY, false);
});

describe('useColorMode', () => {
	it('follows the system in auto mode', async () => {
		const { api, dispose } = await mountUtil(() => useColorMode());
		try {
			expect(api.store).toBe('auto');
			expect(api.value).toBe('light');
			expect(document.documentElement.classList.contains('light')).toBe(true);
			setMediaMatches(DARK_QUERY, true);
			await tick();
			expect(api.system).toBe('dark');
			expect(api.value).toBe('dark');
			expect(document.documentElement.classList.contains('dark')).toBe(true);
			expect(document.documentElement.classList.contains('light')).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('persists explicit modes', async () => {
		const first = await mountUtil(() => useColorMode());
		try {
			first.api.value = 'dark';
			await tick();
			// Plain strings pass through unquoted (storage codec).
			expect(window.localStorage.getItem(KEY)).toBe('dark');
		} finally {
			await first.dispose();
		}
		const second = await mountUtil(() => useColorMode());
		try {
			expect(second.api.store).toBe('dark');
			expect(second.api.value).toBe('dark');
		} finally {
			await second.dispose();
		}
	});

	it('skips persistence with a null key', async () => {
		const { api, dispose } = await mountUtil(() => useColorMode({ storageKey: null }));
		try {
			api.value = 'dark';
			await tick();
			expect(window.localStorage.getItem(KEY)).toBeNull();
			expect(document.documentElement.classList.contains('dark')).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('writes custom attributes and modes', async () => {
		const { api, dispose } = await mountUtil(() =>
			useColorMode({ attribute: 'data-theme', modes: { dark: 'night', light: 'day' } })
		);
		try {
			api.value = 'dark';
			await tick();
			expect(document.documentElement.getAttribute('data-theme')).toBe('night');
			api.store = 'light';
			await tick();
			expect(document.documentElement.getAttribute('data-theme')).toBe('day');
		} finally {
			await dispose();
		}
	});

	it('delegates to onChanged when provided', async () => {
		const onChanged = vi.fn();
		const { api, dispose } = await mountUtil(() => useColorMode({ onChanged }));
		try {
			expect(onChanged).toHaveBeenCalledTimes(1);
			expect(document.documentElement.classList.contains('light')).toBe(false);
			api.value = 'dark';
			await tick();
			expect(onChanged).toHaveBeenCalledTimes(2);
			const [, defaultHandler] = onChanged.mock.calls[1] ?? [];
			expect(typeof defaultHandler).toBe('function');
			(defaultHandler as (mode: string) => void)('dark');
			expect(document.documentElement.classList.contains('dark')).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('uses an external store when given', async () => {
		const external = { value: 'light' as string };
		const { api, dispose } = await mountUtil(() =>
			useColorMode({ storageRef: external, storageKey: 'unused' })
		);
		try {
			expect(api.store).toBe('light');
			api.value = 'dark';
			expect(external.value).toBe('dark');
			expect(window.localStorage.getItem('unused')).toBeNull();
		} finally {
			await dispose();
		}
	});

	it('leaves no transition guard behind', async () => {
		const { api, dispose } = await mountUtil(() => useColorMode());
		try {
			const styles = () =>
				Array.from(document.head.querySelectorAll('style')).filter((el) =>
					(el.textContent ?? '').includes('transition:none')
				);
			api.value = 'dark';
			await tick();
			await tick();
			expect(styles().length).toBe(0);
			expect(document.documentElement.classList.contains('dark')).toBe(true);
		} finally {
			await dispose();
		}
	});
});
