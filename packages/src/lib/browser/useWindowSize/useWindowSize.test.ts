// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { useWindowSize } from './index.ts';

function setViewport(width: number, height: number) {
	Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
	Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
	window.dispatchEvent(new window.Event('resize'));
}

describe('useWindowSize', () => {
	it('reports finite dimensions after mount', async () => {
		const { api, dispose } = await mountUtil(() => useWindowSize());
		try {
			expect(Number.isFinite(api.width)).toBe(true);
			expect(Number.isFinite(api.height)).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('updates on resize', async () => {
		const { api, dispose } = await mountUtil(() => useWindowSize());
		try {
			setViewport(800, 600);
			await tick();
			expect(api.width).toBe(800);
			expect(api.height).toBe(600);
		} finally {
			await dispose();
			setViewport(1024, 768);
		}
	});

	it('refreshes on orientation changes', async () => {
		const { api, dispose } = await mountUtil(() => useWindowSize());
		try {
			setViewport(500, 900);
			setMediaMatches('(orientation: portrait)', true);
			await tick();
			expect(api.width).toBe(500);
			expect(api.height).toBe(900);
		} finally {
			await dispose();
			setViewport(1024, 768);
		}
	});

	it('reads outer dimensions with type:outer', async () => {
		Object.defineProperty(window, 'outerWidth', { configurable: true, value: 1280 });
		Object.defineProperty(window, 'outerHeight', { configurable: true, value: 800 });
		const { api, dispose } = await mountUtil(() => useWindowSize({ type: 'outer' }));
		try {
			expect(api.width).toBe(1280);
			expect(api.height).toBe(800);
		} finally {
			await dispose();
		}
	});

	it('falls back to inner without a visual viewport', async () => {
		expect(window.visualViewport ?? null).toBeNull();
		const { api, dispose } = await mountUtil(() => useWindowSize({ type: 'visual' }));
		try {
			expect(api.width).toBe(window.innerWidth);
		} finally {
			await dispose();
		}
	});
});
