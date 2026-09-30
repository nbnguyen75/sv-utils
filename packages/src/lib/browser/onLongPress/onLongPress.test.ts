// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { onLongPress } from './index.ts';

function press(target: EventTarget, x = 50, y = 50): void {
	target.dispatchEvent(
		new window.MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y })
	);
}

function move(target: EventTarget, x = 50, y = 50): void {
	target.dispatchEvent(
		new window.MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y })
	);
}

function release(target: EventTarget, x = 50, y = 50): void {
	target.dispatchEvent(
		new window.MouseEvent('pointerup', { bubbles: true, clientX: x, clientY: y })
	);
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

describe('onLongPress', () => {
	it('fires after the delay while held', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onLongPress(() => button, handler, { delay: 30 }));
		try {
			press(button);
			expect(handler).not.toHaveBeenCalled();
			await sleep(60);
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler.mock.calls[0]?.[0]).toBeInstanceOf(window.MouseEvent);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('reports a short press via onMouseUp', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const onMouseUp = vi.fn();
		const { dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: 1000, onMouseUp })
		);
		try {
			press(button, 10, 10);
			release(button, 13, 14);
			expect(handler).not.toHaveBeenCalled();
			expect(onMouseUp).toHaveBeenCalledTimes(1);
			const [duration, distance, isLongPress] = onMouseUp.mock.calls[0] ?? [];
			expect(duration).toEqual(expect.any(Number));
			expect(distance).toBeCloseTo(5, 5);
			expect(isLongPress).toBe(false);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('reports a long press via onMouseUp', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const onMouseUp = vi.fn();
		const { dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: 30, onMouseUp })
		);
		try {
			press(button);
			await sleep(60);
			expect(handler).toHaveBeenCalledTimes(1);
			release(button);
			expect(onMouseUp).toHaveBeenCalledTimes(1);
			expect(onMouseUp.mock.calls[0]?.[2]).toBe(true);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('cancels when drifting past the threshold', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: 40, distanceThreshold: 10 })
		);
		try {
			press(button, 0, 0);
			move(button, 30, 0);
			await sleep(80);
			expect(handler).not.toHaveBeenCalled();
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('disables the drift check with false', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: 30, distanceThreshold: false })
		);
		try {
			press(button, 0, 0);
			move(button, 300, 0);
			await sleep(60);
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('supports a delay function', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: () => 30 })
		);
		try {
			press(button);
			await sleep(60);
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('self modifier ignores child targets', async () => {
		const button = document.createElement('button');
		const child = document.createElement('span');
		button.appendChild(child);
		document.body.appendChild(button);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: 30, modifiers: { self: true } })
		);
		try {
			press(child);
			await sleep(60);
			expect(handler).not.toHaveBeenCalled();
			press(button);
			await sleep(60);
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			button.remove();
			await dispose();
		}
	});

	it('stop prevents a pending fire', async () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		const handler = vi.fn();
		const { api: stop, dispose } = await mountUtil(() =>
			onLongPress(() => button, handler, { delay: 30 })
		);
		try {
			press(button);
			stop();
			await sleep(60);
			expect(handler).not.toHaveBeenCalled();
		} finally {
			button.remove();
			await dispose();
		}
	});
});
