// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useScriptTag } from './index.ts';

const SRC = 'https://example.com/widget.js';

function scriptEl(): HTMLScriptElement | null {
	return document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
}

/** Manual instances never auto-unload: scrub leftovers per test. */
function scrub(): void {
	for (const element of Array.from(document.querySelectorAll(`script[src="${SRC}"]`))) {
		element.remove();
	}
}

describe('useScriptTag', () => {
	it('loads immediately and exposes the element', async () => {
		const onLoaded = vi.fn();
		const { api, dispose } = await mountUtil(() => useScriptTag(SRC, onLoaded));
		try {
			const element = scriptEl();
			expect(element).not.toBeNull();
			expect(element?.async).toBe(true);
			expect(element?.type).toBe('text/javascript');
			element?.dispatchEvent(new window.Event('load'));
			await expect(api.load()).resolves.toBe(element);
			expect(api.scriptTag).toBe(element);
			expect(element?.hasAttribute('data-loaded')).toBe(true);
			expect(onLoaded).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
			expect(scriptEl()).toBeNull();
		}
	});

	it('resolves without waiting when asked', async () => {
		const { api, dispose } = await mountUtil(() =>
			useScriptTag(SRC, () => {}, { immediate: false, manual: true })
		);
		try {
			expect(scriptEl()).toBeNull();
			const element = await api.load(false);
			expect(element).toBe(scriptEl());
			expect(api.scriptTag).toBe(scriptEl());
		} finally {
			api.unload();
			scrub();
			await dispose();
		}
	});

	it('rejects on error', async () => {
		const { api, dispose } = await mountUtil(() =>
			useScriptTag(SRC, () => {}, { immediate: false, manual: true })
		);
		try {
			const pending = api.load();
			const failure = expect(pending).rejects.toBeInstanceOf(window.Event);
			scriptEl()?.dispatchEvent(new window.Event('error'));
			await failure;
		} finally {
			scrub();
			await dispose();
		}
	});

	it('reuses an already-loaded script', async () => {
		const existing = document.createElement('script');
		existing.src = SRC;
		existing.setAttribute('data-loaded', 'true');
		document.head.appendChild(existing);
		const { api, dispose } = await mountUtil(() =>
			useScriptTag(SRC, () => {}, { immediate: false, manual: true })
		);
		try {
			await expect(api.load()).resolves.toBe(existing);
			expect(document.querySelectorAll(`script[src="${SRC}"]`).length).toBe(1);
		} finally {
			await dispose();
			existing.remove();
		}
	});

	it('unloads and reloads cleanly', async () => {
		const { api, dispose } = await mountUtil(() =>
			useScriptTag(SRC, () => {}, { immediate: false, manual: true })
		);
		try {
			await api.load(false);
			expect(scriptEl()).not.toBeNull();
			api.unload();
			expect(scriptEl()).toBeNull();
			expect(api.scriptTag).toBeNull();
			await api.load(false);
			expect(scriptEl()).not.toBeNull();
		} finally {
			api.unload();
			scrub();
			await dispose();
		}
	});

	it('resolves false without a document', async () => {
		const { api, dispose } = await mountUtil(() =>
			useScriptTag(SRC, () => {}, { document: null, manual: true })
		);
		try {
			await expect(api.load()).resolves.toBe(false);
			expect(api.scriptTag).toBeNull();
		} finally {
			await dispose();
		}
	});
});
