// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { onKeyDown, onKeyPressed, onKeyStroke, onKeyUp } from './index.ts';

function key(target: EventTarget, type: string, init: KeyboardEventInit = {}): void {
	target.dispatchEvent(new window.KeyboardEvent(type, { bubbles: true, ...init }));
}

describe('onKeyStroke', () => {
	it('matches a single key', async () => {
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onKeyStroke('Escape', handler));
		try {
			key(window, 'keydown', { key: 'Enter' });
			expect(handler).not.toHaveBeenCalled();
			key(window, 'keydown', { key: 'Escape' });
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('matches key arrays and predicates', async () => {
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onKeyStroke(['a', 'b'], handler));
		try {
			key(window, 'keydown', { key: 'a' });
			key(window, 'keydown', { key: 'c' });
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('listens to everything without a filter', async () => {
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onKeyStroke(handler));
		try {
			key(window, 'keydown', { key: 'x' });
			key(window, 'keydown', { key: 'y' });
			expect(handler).toHaveBeenCalledTimes(2);
		} finally {
			await dispose();
		}
	});

	it('dedupes auto-repeat while held', async () => {
		const handler = vi.fn();
		const { dispose } = await mountUtil(() => onKeyStroke('a', handler, { dedupe: true }));
		try {
			key(window, 'keydown', { key: 'a', repeat: true });
			expect(handler).not.toHaveBeenCalled();
			key(window, 'keydown', { key: 'a' });
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('scopes to a target and stops on demand', async () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		const handler = vi.fn();
		const { api: stop, dispose } = await mountUtil(() =>
			onKeyStroke('Enter', handler, { target: () => input })
		);
		try {
			key(window, 'keydown', { key: 'Enter' });
			expect(handler).not.toHaveBeenCalled();
			key(input, 'keydown', { key: 'Enter' });
			expect(handler).toHaveBeenCalledTimes(1);
			stop();
			key(input, 'keydown', { key: 'Enter' });
			expect(handler).toHaveBeenCalledTimes(1);
		} finally {
			input.remove();
			await dispose();
		}
	});

	it('shorthands listen to their event', async () => {
		const down = vi.fn();
		const pressed = vi.fn();
		const up = vi.fn();
		const { dispose } = await mountUtil(() => {
			onKeyDown('a', down);
			onKeyPressed('a', pressed);
			onKeyUp('a', up);
			return true;
		});
		try {
			key(window, 'keydown', { key: 'a' });
			key(window, 'keypress', { key: 'a' });
			key(window, 'keyup', { key: 'a' });
			expect(down).toHaveBeenCalledTimes(1);
			expect(pressed).toHaveBeenCalledTimes(1);
			expect(up).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});
});
