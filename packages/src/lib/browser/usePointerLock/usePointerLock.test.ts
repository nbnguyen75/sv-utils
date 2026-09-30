// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { usePointerLock } from './index.ts';

/** jsdom ships no Pointer Lock API: install a minimal fake per file. */
function installPointerLock(): void {
	if ('pointerLockElement' in document) return;
	let holder: Element | null = null;
	Object.defineProperty(document, 'pointerLockElement', {
		configurable: true,
		get: () => holder,
		set: (value: Element | null) => {
			holder = value;
		}
	});
}

function armElement(box: HTMLElement): void {
	box.requestPointerLock = () => {
		(document as unknown as { pointerLockElement: Element | null }).pointerLockElement = box;
		document.dispatchEvent(new window.Event('pointerlockchange'));
		return Promise.resolve();
	};
}

function armDocument(): void {
	document.exitPointerLock = () => {
		(document as unknown as { pointerLockElement: Element | null }).pointerLockElement = null;
		document.dispatchEvent(new window.Event('pointerlockchange'));
	};
}

describe('usePointerLock', () => {
	it('locks and unlocks an element', async () => {
		installPointerLock();
		armDocument();
		const box = document.createElement('div');
		document.body.appendChild(box);
		armElement(box);
		const { api, dispose } = await mountUtil(() => usePointerLock(() => box));
		try {
			expect(api.isSupported).toBe(true);
			expect(api.element).toBeUndefined();
			const locked = await api.lock();
			expect(locked).toBe(box);
			expect(api.element).toBe(box);
			expect(await api.unlock()).toBe(true);
			expect(api.element).toBeNull();
		} finally {
			box.remove();
			await dispose();
		}
	});

	it('records the click target as trigger element', async () => {
		installPointerLock();
		armDocument();
		const box = document.createElement('div');
		const button = document.createElement('button');
		document.body.append(box, button);
		armElement(box);
		let lockPromise: Promise<unknown> | undefined;
		button.addEventListener('click', (event) => {
			// Lock synchronously inside the handler: `currentTarget` is
			// only set while dispatching (upstream's `@click="lock"` shape).
			lockPromise = api.lock(event);
		});
		const { api, dispose } = await mountUtil(() => usePointerLock(() => box));
		try {
			button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
			await lockPromise;
			expect(api.element).toBe(box);
			expect(api.triggerElement).toBe(button);
		} finally {
			box.remove();
			button.remove();
			await dispose();
		}
	});

	it('rejects without a target', async () => {
		installPointerLock();
		const { api, dispose } = await mountUtil(() => usePointerLock());
		try {
			await expect(api.lock(undefined)).rejects.toThrow('Target element undefined.');
		} finally {
			await dispose();
		}
	});

	it('unlock resolves false when idle', async () => {
		installPointerLock();
		const { api, dispose } = await mountUtil(() => usePointerLock());
		try {
			expect(api.element).toBeUndefined();
			expect(await api.unlock()).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('throws when the API is absent', async () => {
		const descriptor = Object.getOwnPropertyDescriptor(document, 'pointerLockElement');
		if (descriptor?.configurable) {
			delete (document as unknown as Record<string, unknown>).pointerLockElement;
		}
		const { api, dispose } = await mountUtil(() => usePointerLock());
		try {
			if (!api.isSupported) {
				await expect(api.lock()).rejects.toThrow('not supported');
				expect(await api.unlock()).toBe(false);
			} else {
				expect(api.isSupported).toBe(true);
			}
		} finally {
			await dispose();
		}
	});
});
