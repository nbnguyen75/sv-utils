// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useMouse } from './index.ts';

describe('useMouse', () => {
	it('tracks client coordinates by default type smoke and exactly by client type', async () => {
		const { api, dispose } = await mountUtil(() => useMouse({ type: 'client' }));
		try {
			expect(api.x).toBe(0);
			expect(api.sourceType).toBeNull();
			window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 30, clientY: 40 }));
			await tick();
			expect(api.x).toBe(30);
			expect(api.y).toBe(40);
			expect(api.sourceType).toBe('mouse');
		} finally {
			await dispose();
		}
	});

	it('supports movement coordinates', async () => {
		const { api, dispose } = await mountUtil(() => useMouse({ type: 'movement' }));
		try {
			window.dispatchEvent(new window.MouseEvent('mousemove', { movementX: 5, movementY: -3 }));
			await tick();
			expect(api.x).toBe(5);
			expect(api.y).toBe(-3);
		} finally {
			await dispose();
		}
	});

	it('supports custom extractors', async () => {
		const { api, dispose } = await mountUtil(() =>
			useMouse({ type: (event) => [event.clientX * 2, event.clientY * 2] })
		);
		try {
			window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
			await tick();
			expect(api.x).toBe(20);
			expect(api.y).toBe(20);
		} finally {
			await dispose();
		}
	});

	it('tracks touches and resets on touchend when configured', async () => {
		const { api, dispose } = await mountUtil(() =>
			useMouse({ initialValue: { x: 1, y: 1 }, resetOnTouchEnds: true })
		);
		try {
			const start = new window.Event('touchstart');
			Object.defineProperty(start, 'touches', {
				value: [{ pageX: 7, pageY: 8, clientX: 7, clientY: 8, screenX: 7, screenY: 8 }]
			});
			window.dispatchEvent(start);
			await tick();
			expect(api.x).toBe(7);
			expect(api.y).toBe(8);
			expect(api.sourceType).toBe('touch');
			window.dispatchEvent(new window.Event('touchend'));
			await tick();
			expect(api.x).toBe(1);
			expect(api.y).toBe(1);
		} finally {
			await dispose();
		}
	});

	it('scopes listening to a target element', async () => {
		const element = document.createElement('div');
		document.body.appendChild(element);
		const { api, dispose } = await mountUtil(() =>
			useMouse({ target: () => element, type: 'client' })
		);
		try {
			window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 99, clientY: 99 }));
			await tick();
			expect(api.x).toBe(0);
			element.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 11, clientY: 12 }));
			await tick();
			expect(api.x).toBe(11);
			expect(api.y).toBe(12);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stops reacting after unmount', async () => {
		const spy = vi.fn();
		const { dispose } = await mountUtil(() =>
			useMouse({
				type: (event) => {
					spy(event.clientX);
					return [event.clientX, event.clientY];
				}
			})
		);
		window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 1, clientY: 1 }));
		await tick();
		expect(spy).toHaveBeenCalled();
		await dispose();
		spy.mockClear();
		window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: 2, clientY: 2 }));
		await tick();
		expect(spy).not.toHaveBeenCalled();
	});
});
