// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { usePointer } from './index.ts';

function pointerMove(target: EventTarget, init: Record<string, number | string>): void {
	const event = new window.MouseEvent('pointermove', {
		clientX: 10,
		clientY: 20
	});
	Object.assign(event, init);
	target.dispatchEvent(event);
}

describe('usePointer', () => {
	it('tracks the full pointer state', async () => {
		const { api, dispose } = await mountUtil(() => usePointer());
		try {
			expect(api.x).toBe(0);
			expect(api.pointerType).toBeNull();
			expect(api.isInside).toBe(false);
			pointerMove(window, { pointerId: 7, pressure: 0.5, pointerType: 'pen', tiltX: 4 });
			expect(api.x).toBe(10);
			expect(api.y).toBe(20);
			expect(api.pointerId).toBe(7);
			expect(api.pressure).toBe(0.5);
			expect(api.pointerType).toBe('pen');
			expect(api.tiltX).toBe(4);
			expect(api.isInside).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('honors the pointer-type filter', async () => {
		const { api, dispose } = await mountUtil(() => usePointer({ pointerTypes: ['touch'] }));
		try {
			pointerMove(window, { pointerType: 'mouse' });
			// Filtered out: position frozen, but presence still noted.
			expect(api.x).toBe(0);
			expect(api.isInside).toBe(true);
			pointerMove(window, { pointerType: 'touch' });
			expect(api.x).toBe(10);
		} finally {
			await dispose();
		}
	});

	it('starts from the initial value', async () => {
		const { api, dispose } = await mountUtil(() =>
			usePointer({ initialValue: { x: 3, y: 4, pointerType: 'mouse' } })
		);
		try {
			expect(api.x).toBe(3);
			expect(api.y).toBe(4);
			expect(api.pointerType).toBe('mouse');
			expect(api.pressure).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('scopes listening to the given target', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const { api, dispose } = await mountUtil(() => usePointer({ target: () => pad }));
		try {
			pointerMove(window, { pointerType: 'mouse' });
			expect(api.isInside).toBe(false);
			pointerMove(pad, { pointerType: 'mouse' });
			expect(api.isInside).toBe(true);
			expect(api.x).toBe(10);
		} finally {
			pad.remove();
			await dispose();
		}
	});

	it('clears presence on leave', async () => {
		const { api, dispose } = await mountUtil(() => usePointer());
		try {
			pointerMove(window, { pointerType: 'mouse' });
			expect(api.isInside).toBe(true);
			window.dispatchEvent(new window.MouseEvent('pointerleave'));
			expect(api.isInside).toBe(false);
		} finally {
			await dispose();
		}
	});
});
