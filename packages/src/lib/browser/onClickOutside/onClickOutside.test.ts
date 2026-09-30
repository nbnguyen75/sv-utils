// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { onClickOutside } from './index.ts';

function click(target: EventTarget, detail = 0): void {
	target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, detail }));
}

async function tick(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('onClickOutside', () => {
	it('fires for outside clicks, ignores inside ones', async () => {
		const menu = document.createElement('div');
		const other = document.createElement('button');
		document.body.append(menu, other);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onClickOutside(() => menu, handler));
		try {
			click(menu);
			await tick();
			expect(handler).not.toHaveBeenCalled();
			click(other);
			await tick();
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			menu.remove();
			other.remove();
			await dispose();
		}
	});

	it('honors element and selector ignores', async () => {
		const menu = document.createElement('div');
		const popover = document.createElement('div');
		popover.className = 'popover';
		const other = document.createElement('button');
		document.body.append(menu, popover, other);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() =>
			onClickOutside(() => menu, handler, { ignore: [() => popover, '.popover'] })
		);
		try {
			click(popover);
			await tick();
			expect(handler).not.toHaveBeenCalled();
			click(other);
			await tick();
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			menu.remove();
			popover.remove();
			other.remove();
			await dispose();
		}
	});

	it('suppresses clicks that started inside', async () => {
		const menu = document.createElement('div');
		const other = document.createElement('button');
		document.body.append(menu, other);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onClickOutside(() => menu, handler));
		try {
			// Real user clicks carry detail >= 1; detail 0 would recompute.
			menu.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
			click(other, 1);
			await tick();
			expect(handler).not.toHaveBeenCalled();
			// Suppression resets: the next outside click fires.
			click(other, 1);
			await tick();
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			menu.remove();
			other.remove();
			await dispose();
		}
	});

	it('controls: stop, cancel, and trigger', async () => {
		const menu = document.createElement('div');
		const other = document.createElement('button');
		document.body.append(menu, other);
		const handler = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			onClickOutside(() => menu, handler, { controls: true })
		);
		// trigger() needs a real event with a target: capture one first.
		let saved: Event | undefined;
		const capture = (event: Event) => {
			saved = event;
		};
		window.addEventListener('click', capture);
		try {
			api.cancel();
			click(other, 1);
			await tick();
			expect(handler).not.toHaveBeenCalled();
			expect(saved).toBeDefined();
			api.trigger(saved as Event);
			expect(handler).toHaveBeenCalledTimes(1);
			api.stop();
			click(other, 1);
			await tick();
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			window.removeEventListener('click', capture);
			menu.remove();
			other.remove();
			await dispose();
		}
	});

	it('detects focus moving into an iframe', async () => {
		const menu = document.createElement('div');
		document.body.appendChild(menu);
		const frame = document.createElement('iframe');
		document.body.appendChild(frame);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() =>
			onClickOutside(() => menu, handler, { detectIframe: true })
		);
		try {
			Object.defineProperty(document, 'activeElement', {
				configurable: true,
				value: frame
			});
			window.dispatchEvent(new window.FocusEvent('blur'));
			await tick();
			await tick();
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			menu.remove();
			frame.remove();
			await dispose();
		}
	});

	it('is a no-op without a target', async () => {
		const other = document.createElement('button');
		document.body.appendChild(other);
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onClickOutside(() => null, handler));
		try {
			click(other, 1);
			await tick();
			expect(handler).not.toHaveBeenCalled();
		} finally {
			other.remove();
			await dispose();
		}
	});
});
