// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useFullscreen } from './index.ts';

function mockFullscreen() {
	const element = document.createElement('div');
	document.body.appendChild(element);
	const request = vi.fn(async () => {});
	const exit = vi.fn(async () => {});
	Object.defineProperty(element, 'requestFullscreen', { configurable: true, value: request });
	Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });
	Object.defineProperty(document, 'fullScreen', { configurable: true, value: false });
	Object.defineProperty(document, 'fullscreenElement', {
		configurable: true,
		writable: true,
		value: null
	});
	return { element, request, exit };
}

describe('useFullscreen', () => {
	it('no-ops safely when unsupported', async () => {
		const element = document.createElement('div');
		document.body.appendChild(element);
		const { api, dispose } = await mountUtil(() => useFullscreen(() => element));
		try {
			expect(api.isSupported).toBe(false);
			expect(api.isFullscreen).toBe(false);
			await api.enter();
			await api.exit();
			await api.toggle();
			expect(api.isFullscreen).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('enters, syncs from events, toggles, and exits', async () => {
		const { element, request, exit } = mockFullscreen();
		const { api, dispose } = await mountUtil(() => useFullscreen(() => element));
		try {
			expect(api.isSupported).toBe(true);
			await api.enter();
			expect(request).toHaveBeenCalledTimes(1);
			expect(api.isFullscreen).toBe(true);
			// Browser-side confirmation arrives via events.
			Object.defineProperty(document, 'fullscreenElement', {
				configurable: true,
				writable: true,
				value: element
			});
			Object.defineProperty(document, 'fullScreen', { configurable: true, value: true });
			document.dispatchEvent(new window.Event('fullscreenchange'));
			await tick();
			expect(api.isFullscreen).toBe(true);
			await api.toggle();
			expect(exit).toHaveBeenCalledTimes(1);
			expect(api.isFullscreen).toBe(false);
			await api.toggle();
			expect(request).toHaveBeenCalledTimes(2);
			expect(api.isFullscreen).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('exits on unmount with autoExit', async () => {
		const { element, exit } = mockFullscreen();
		const { api, dispose } = await mountUtil(() =>
			useFullscreen(() => element, { autoExit: true })
		);
		await api.enter();
		expect(api.isFullscreen).toBe(true);
		await dispose();
		element.remove();
		expect(exit).toHaveBeenCalledTimes(1);
	});
});
