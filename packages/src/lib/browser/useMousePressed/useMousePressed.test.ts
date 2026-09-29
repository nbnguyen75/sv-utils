// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useMousePressed } from './index.ts';

describe('useMousePressed', () => {
	it('tracks mouse press and release', async () => {
		const target = document.createElement('div');
		document.body.appendChild(target);
		const onPressed = vi.fn();
		const onReleased = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useMousePressed({ onPressed, onReleased, target: () => target })
		);
		try {
			expect(api.pressed).toBe(false);
			expect(api.sourceType).toBeNull();
			target.dispatchEvent(new window.MouseEvent('mousedown'));
			await tick();
			expect(api.pressed).toBe(true);
			expect(api.sourceType).toBe('mouse');
			expect(onPressed).toHaveBeenCalledTimes(1);
			window.dispatchEvent(new window.MouseEvent('mouseup'));
			await tick();
			expect(api.pressed).toBe(false);
			expect(api.sourceType).toBeNull();
			expect(onReleased).toHaveBeenCalledTimes(1);
		} finally {
			target.remove();
			await dispose();
		}
	});

	it('tracks touches and drags', async () => {
		const target = document.createElement('div');
		document.body.appendChild(target);
		const { api, dispose } = await mountUtil(() => useMousePressed({ target: () => target }));
		try {
			target.dispatchEvent(new window.Event('touchstart'));
			await tick();
			expect(api.pressed).toBe(true);
			expect(api.sourceType).toBe('touch');
			window.dispatchEvent(new window.Event('touchend'));
			await tick();
			expect(api.pressed).toBe(false);
			target.dispatchEvent(new window.Event('dragstart'));
			await tick();
			expect(api.pressed).toBe(true);
			expect(api.sourceType).toBe('mouse');
			window.dispatchEvent(new window.Event('drop'));
			await tick();
			expect(api.pressed).toBe(false);
		} finally {
			target.remove();
			await dispose();
		}
	});

	it('respects the initial value', async () => {
		const { api, dispose } = await mountUtil(() => useMousePressed({ initialValue: true }));
		try {
			expect(api.pressed).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('ignores releases after unmount', async () => {
		const { api, dispose } = await mountUtil(() => useMousePressed());
		let disposed = false;
		try {
			window.dispatchEvent(new window.MouseEvent('mousedown'));
			await tick();
			expect(api.pressed).toBe(true);
			await dispose();
			disposed = true;
			window.dispatchEvent(new window.MouseEvent('mouseup'));
			await tick();
			expect(api.pressed).toBe(true);
		} finally {
			if (!disposed) await dispose();
		}
	});
});
