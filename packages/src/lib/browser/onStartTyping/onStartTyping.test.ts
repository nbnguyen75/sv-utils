// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { isFocusedElementEditable, isTypedCharValid, onStartTyping } from './index.ts';

function key(target: EventTarget, init: KeyboardEventInit & { keyCode?: number }): void {
	const { keyCode, ...rest } = init;
	const event = new window.KeyboardEvent('keydown', { bubbles: true, ...rest });
	if (keyCode !== undefined) {
		Object.defineProperty(event, 'keyCode', { value: keyCode });
	}
	target.dispatchEvent(event);
}

describe('onStartTyping', () => {
	it('fires for typeable keys when nothing editable is focused', async () => {
		const callback = vi.fn();
		const { dispose } = await mountUtil(() => onStartTyping(callback));
		try {
			expect(isFocusedElementEditable()).toBe(false);
			key(document, { key: 'a', keyCode: 65 });
			expect(callback).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('stays quiet inside editable elements', async () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		const callback = vi.fn();
		const { dispose } = await mountUtil(() => onStartTyping(callback));
		try {
			input.focus();
			expect(isFocusedElementEditable()).toBe(true);
			key(document, { key: 'a', keyCode: 65 });
			expect(callback).not.toHaveBeenCalled();
			(input as HTMLInputElement).blur();
		} finally {
			input.remove();
			await dispose();
		}
	});

	it('ignores modified and non-character keys', async () => {
		expect(isTypedCharValid({ keyCode: 65 } as KeyboardEvent)).toBe(true);
		expect(isTypedCharValid({ keyCode: 48 } as KeyboardEvent)).toBe(true);
		expect(isTypedCharValid({ keyCode: 13 } as KeyboardEvent)).toBe(false);
		expect(isTypedCharValid({ keyCode: 65, metaKey: true } as unknown as KeyboardEvent)).toBe(
			false
		);
		const callback = vi.fn();
		const { dispose } = await mountUtil(() => onStartTyping(callback));
		try {
			key(document, { key: 'Control', keyCode: 17, ctrlKey: true });
			expect(callback).not.toHaveBeenCalled();
		} finally {
			await dispose();
		}
	});

	it('accepts custom validity checks', async () => {
		const callback = vi.fn();
		const { dispose } = await mountUtil(() =>
			onStartTyping(callback, { isTypedCharValid: () => true })
		);
		try {
			key(document, { key: 'Escape', keyCode: 27 });
			expect(callback).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('stop silences the listener', async () => {
		const callback = vi.fn();
		const { api: stop, dispose } = await mountUtil(() => onStartTyping(callback));
		try {
			stop();
			key(document, { key: 'a', keyCode: 65 });
			expect(callback).not.toHaveBeenCalled();
		} finally {
			await dispose();
		}
	});
});
