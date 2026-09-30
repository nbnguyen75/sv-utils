// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useClipboardItems } from './index.ts';

interface ClipboardDriver {
	written: ClipboardItems[];
	setItems(items: ClipboardItems): void;
}

/** jsdom ships no clipboard: install a controllable fake per test. */
function installClipboard(): ClipboardDriver {
	const written: ClipboardItems[] = [];
	let items: ClipboardItems = [];
	const clipboard = {
		write: vi.fn(async (value: ClipboardItems) => {
			written.push(value);
		}),
		read: vi.fn(async () => items)
	};
	Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: clipboard });
	return {
		written,
		setItems: (value: ClipboardItems) => {
			items = value;
		}
	};
}

function fakeItems(): ClipboardItems {
	return [
		{ types: ['text/plain'], getType: async () => new Blob(['hi']) } as unknown as ClipboardItem
	];
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

describe('useClipboardItems', () => {
	it('writes items and flags copied', async () => {
		installClipboard();
		const { api, dispose } = await mountUtil(() => useClipboardItems({ copiedDuring: 30 }));
		try {
			expect(api.isSupported).toBe(true);
			expect(api.content).toEqual([]);
			const items = fakeItems();
			await api.copy(items);
			expect(api.content).toEqual(items);
			expect(api.copied).toBe(true);
			await sleep(60);
			expect(api.copied).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('copies the default source when called bare', async () => {
		const driver = installClipboard();
		const items = fakeItems();
		const { api, dispose } = await mountUtil(() => useClipboardItems({ source: () => items }));
		try {
			await api.copy();
			expect(driver.written[0]).toBe(items);
			expect(api.content).toEqual(items);
		} finally {
			await dispose();
		}
	});

	it('reads the clipboard on demand', async () => {
		const driver = installClipboard();
		const items = fakeItems();
		driver.setItems(items);
		const { api, dispose } = await mountUtil(() => useClipboardItems());
		try {
			api.read();
			await sleep(10);
			expect(api.content).toEqual(items);
		} finally {
			await dispose();
		}
	});

	it('refreshes on copy events in read mode', async () => {
		const driver = installClipboard();
		const items = fakeItems();
		driver.setItems(items);
		const { api, dispose } = await mountUtil(() => useClipboardItems({ read: true }));
		try {
			window.dispatchEvent(new window.Event('copy'));
			await sleep(10);
			expect(api.content).toEqual(items);
		} finally {
			await dispose();
		}
	});

	it('is inert without the API', async () => {
		const { api, dispose } = await mountUtil(() =>
			useClipboardItems({ navigator: null, copiedDuring: 10 })
		);
		try {
			expect(api.isSupported).toBe(false);
			await api.copy(fakeItems());
			expect(api.content).toEqual([]);
			expect(api.copied).toBe(false);
		} finally {
			await dispose();
		}
	});
});
