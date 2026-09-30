// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useSwipe } from './index.ts';
import type { UseSwipeDirection } from './index.ts';

interface FakeTouch {
	clientX: number;
	clientY: number;
}

/** jsdom has no Touch constructor: attach a plain touches list. */
function touchEvent(type: string, touches: FakeTouch[]): Event {
	const event = new window.Event(type, { bubbles: true, cancelable: true });
	(event as unknown as { touches: FakeTouch[] }).touches = touches;
	return event;
}

const at = (x: number, y: number): FakeTouch => ({ clientX: x, clientY: y });

describe('useSwipe', () => {
	it('detects a left swipe past the threshold', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const { api, dispose } = await mountUtil(() => useSwipe(() => pad));
		try {
			pad.dispatchEvent(touchEvent('touchstart', [at(100, 100)]));
			expect(api.coordsStart).toEqual({ x: 100, y: 100 });
			pad.dispatchEvent(touchEvent('touchmove', [at(30, 105)]));
			expect(api.isSwiping).toBe(true);
			expect(api.direction).toBe('left');
			expect(api.lengthX).toBe(70);
			expect(api.coordsEnd).toEqual({ x: 30, y: 105 });
			pad.dispatchEvent(touchEvent('touchend', []));
			expect(api.isSwiping).toBe(false);
		} finally {
			pad.remove();
			await dispose();
		}
	});

	it('stays idle below the threshold', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const { api, dispose } = await mountUtil(() => useSwipe(() => pad));
		try {
			pad.dispatchEvent(touchEvent('touchstart', [at(100, 100)]));
			pad.dispatchEvent(touchEvent('touchmove', [at(90, 95)]));
			expect(api.isSwiping).toBe(false);
			expect(api.direction).toBe('none');
		} finally {
			pad.remove();
			await dispose();
		}
	});

	it('detects an upward swipe', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const { api, dispose } = await mountUtil(() => useSwipe(() => pad, { threshold: 20 }));
		try {
			pad.dispatchEvent(touchEvent('touchstart', [at(50, 100)]));
			pad.dispatchEvent(touchEvent('touchmove', [at(52, 30)]));
			expect(api.direction).toBe('up');
			expect(api.lengthY).toBe(70);
		} finally {
			pad.remove();
			await dispose();
		}
	});

	it('fires callbacks with the end direction', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const onSwipeStart = vi.fn();
		const onSwipe = vi.fn();
		const seen: UseSwipeDirection[] = [];
		const { dispose } = await mountUtil(() =>
			useSwipe(() => pad, {
				onSwipeStart,
				onSwipe,
				onSwipeEnd: (_event, direction) => {
					seen.push(direction);
				}
			})
		);
		try {
			pad.dispatchEvent(touchEvent('touchstart', [at(0, 0)]));
			expect(onSwipeStart).toHaveBeenCalledTimes(1);
			pad.dispatchEvent(touchEvent('touchmove', [at(80, 5)]));
			expect(onSwipe).toHaveBeenCalledTimes(1);
			pad.dispatchEvent(touchEvent('touchcancel', []));
			expect(seen).toEqual(['right']);
		} finally {
			pad.remove();
			await dispose();
		}
	});

	it('ignores multi-touch gestures', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const onSwipeStart = vi.fn();
		const { api, dispose } = await mountUtil(() => useSwipe(() => pad, { onSwipeStart }));
		try {
			pad.dispatchEvent(touchEvent('touchstart', [at(0, 0), at(50, 50)]));
			expect(onSwipeStart).not.toHaveBeenCalled();
			expect(api.isSwiping).toBe(false);
		} finally {
			pad.remove();
			await dispose();
		}
	});

	it('stop silences the instance', async () => {
		const pad = document.createElement('div');
		document.body.appendChild(pad);
		const { api, dispose } = await mountUtil(() => useSwipe(() => pad));
		try {
			api.stop();
			pad.dispatchEvent(touchEvent('touchstart', [at(0, 0)]));
			pad.dispatchEvent(touchEvent('touchmove', [at(90, 0)]));
			expect(api.isSwiping).toBe(false);
			expect(api.direction).toBe('none');
		} finally {
			pad.remove();
			await dispose();
		}
	});
});
