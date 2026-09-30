// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useImage } from './index.ts';

class FakeImage {
	onload: (() => void) | null = null;
	onerror: ((reason?: unknown) => void) | null = null;
	complete = false;
	width = 0;
	height = 0;
	private pendingSrc = '';
	private fail: boolean;

	constructor(fail = false) {
		this.fail = fail;
	}

	get src(): string {
		return this.pendingSrc;
	}

	set src(value: string) {
		this.pendingSrc = value;
		setTimeout(() => {
			this.complete = true;
			if (this.fail) this.onerror?.(new Error('load failed'));
			else this.onload?.();
		}, 0);
	}
}

/** jsdom never loads images: stand in a controllable Image. */
function installImage(fail = false): void {
	Object.defineProperty(window, 'Image', {
		configurable: true,
		value: class extends FakeImage {
			constructor() {
				super(fail);
			}
		}
	});
}

/** The fake resolves on a macrotask: tick() alone cannot flush it. */
async function flushLoad(): Promise<void> {
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 10));
	await tick();
}

describe('useImage', () => {
	it('loads and exposes the element', async () => {
		installImage();
		const { api, dispose } = await mountUtil(() =>
			useImage(
				{ src: 'photo.png', srcset: 'photo@2x.png 2x', width: 4, height: 3 },
				{ onError: () => {} }
			)
		);
		try {
			expect(api.isLoading).toBe(true);
			expect(api.state).toBeUndefined();
			await flushLoad();
			expect(api.isReady).toBe(true);
			expect(api.isLoading).toBe(false);
			const image = api.state as unknown as Record<string, unknown>;
			expect(image['src']).toBe('photo.png');
			expect(image['srcset']).toBe('photo@2x.png 2x');
			expect(image['width']).toBe(4);
		} finally {
			await dispose();
		}
	});

	it('surfaces load failures', async () => {
		installImage(true);
		const onError = vi.fn();
		const { api, dispose } = await mountUtil(() => useImage({ src: 'broken.png' }, { onError }));
		try {
			await flushLoad();
			// Rejections settle error/isLoading; isReady stays success-only.
			expect(api.isLoading).toBe(false);
			expect(api.state).toBeUndefined();
			expect(api.error).toBeInstanceOf(Error);
			expect(onError).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('reloads when options change', async () => {
		installImage();
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const image = useImage(() => ({ src: `photo-${counter.count}.png` }), {
				onError: () => {}
			});
			return { counter, image };
		});
		try {
			await flushLoad();
			const first = api.image.state as unknown as Record<string, unknown>;
			expect(first['src']).toBe('photo-0.png');
			api.counter.inc();
			await flushLoad();
			const second = api.image.state as unknown as Record<string, unknown>;
			expect(second['src']).toBe('photo-1.png');
			expect(second).not.toBe(first);
		} finally {
			await dispose();
		}
	});

	it('stays idle with immediate false', async () => {
		installImage();
		const { api, dispose } = await mountUtil(() =>
			useImage({ src: 'photo.png' }, { immediate: false, onError: () => {} })
		);
		try {
			await tick();
			await tick();
			expect(api.isLoading).toBe(false);
			expect(api.isReady).toBe(false);
			expect(api.state).toBeUndefined();
		} finally {
			await dispose();
		}
	});
});
