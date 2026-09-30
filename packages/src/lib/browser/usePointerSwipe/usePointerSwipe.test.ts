// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { usePointerSwipe } from './index.ts';

/** jsdom PointerEvent support is partial: drive with MouseEvent + extras. */
function pointerEvent(
	type: string,
	init: { x: number; y: number; buttons?: number; pointerType?: string }
): Event {
	const event = new window.MouseEvent(type, {
		bubbles: true,
		clientX: init.x,
		clientY: init.y,
		buttons: init.buttons ?? 1
	});
	Object.assign(event, { pointerId: 3, pointerType: init.pointerType ?? 'mouse' });
	return event;
}

describe('usePointerSwipe', () => {
	it('detects a right swipe past the threshold', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() => usePointerSwipe(() => card));
		try {
			card.dispatchEvent(pointerEvent('pointerdown', { x: 10, y: 10 }));
			expect(api.posStart).toEqual({ x: 10, y: 10 });
			card.dispatchEvent(pointerEvent('pointermove', { x: 90, y: 14 }));
			expect(api.isSwiping).toBe(true);
			expect(api.direction).toBe('right');
			expect(api.distanceX).toBe(-80);
			card.dispatchEvent(pointerEvent('pointerup', { x: 90, y: 14, buttons: 0 }));
			expect(api.isSwiping).toBe(false);
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('ignores moves without a press', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const onSwipe = vi.fn();
		const { api, dispose } = await mountUtil(() => usePointerSwipe(() => card, { onSwipe }));
		try {
			card.dispatchEvent(pointerEvent('pointermove', { x: 90, y: 10 }));
			expect(api.isSwiping).toBe(false);
			expect(onSwipe).not.toHaveBeenCalled();
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('filters pointer types', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() =>
			usePointerSwipe(() => card, { pointerTypes: ['touch'] })
		);
		try {
			card.dispatchEvent(pointerEvent('pointerdown', { x: 10, y: 10, pointerType: 'mouse' }));
			card.dispatchEvent(pointerEvent('pointermove', { x: 90, y: 10, pointerType: 'mouse' }));
			expect(api.isSwiping).toBe(false);
			card.dispatchEvent(pointerEvent('pointerdown', { x: 10, y: 10, pointerType: 'touch' }));
			card.dispatchEvent(pointerEvent('pointermove', { x: 90, y: 10, pointerType: 'touch' }));
			expect(api.isSwiping).toBe(true);
			expect(api.direction).toBe('right');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('sets touch-action on the target', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const { dispose } = await mountUtil(() => usePointerSwipe(() => card));
		try {
			expect(card.style.touchAction).toBe('pan-y');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('ends with the swipe direction', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const seen: string[] = [];
		const { dispose } = await mountUtil(() =>
			usePointerSwipe(() => card, {
				onSwipeEnd: (_event, direction) => {
					seen.push(direction);
				}
			})
		);
		try {
			card.dispatchEvent(pointerEvent('pointerdown', { x: 50, y: 100 }));
			card.dispatchEvent(pointerEvent('pointermove', { x: 52, y: 20 }));
			card.dispatchEvent(pointerEvent('pointerup', { x: 52, y: 20, buttons: 0 }));
			expect(seen).toEqual(['up']);
		} finally {
			card.remove();
			await dispose();
		}
	});
});
