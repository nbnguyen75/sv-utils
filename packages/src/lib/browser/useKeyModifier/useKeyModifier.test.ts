// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useKeyModifier } from './index.ts';

/** Synthetic events carry no modifier state: stub it per event. */
function withModifiers(type: string, modifiers: string[]): Event {
	const event = new window.MouseEvent(type, { bubbles: true });
	(event as unknown as { getModifierState: (key: string) => boolean }).getModifierState = (
		key: string
	) => modifiers.includes(key);
	return event;
}

describe('useKeyModifier', () => {
	it('starts null and updates on events', async () => {
		const { api, dispose } = await mountUtil(() => useKeyModifier('Shift'));
		try {
			expect(api.value).toBeNull();
			document.dispatchEvent(withModifiers('keydown', ['Shift']));
			expect(api.value).toBe(true);
			document.dispatchEvent(withModifiers('keyup', []));
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('honors a boolean initial value', async () => {
		const { api, dispose } = await mountUtil(() => useKeyModifier('Control', { initial: true }));
		try {
			expect(api.value).toBe(true);
			document.dispatchEvent(withModifiers('mousedown', []));
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('listens only to the given events', async () => {
		const { api, dispose } = await mountUtil(() => useKeyModifier('Alt', { events: ['keydown'] }));
		try {
			document.dispatchEvent(withModifiers('mousedown', ['Alt']));
			expect(api.value).toBeNull();
			document.dispatchEvent(withModifiers('keydown', ['Alt']));
			expect(api.value).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('a null document disables listening', async () => {
		const { api, dispose } = await mountUtil(() => useKeyModifier('Shift', { document: null }));
		try {
			document.dispatchEvent(withModifiers('keydown', ['Shift']));
			expect(api.value).toBeNull();
		} finally {
			await dispose();
		}
	});
});
