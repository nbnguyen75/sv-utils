// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { DefaultMagicKeysAliasMap, useMagicKeys } from './index.ts';

function keydown(init: KeyboardEventInit): void {
	window.dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, ...init }));
}

function keyup(init: KeyboardEventInit): void {
	window.dispatchEvent(new window.KeyboardEvent('keyup', { bubbles: true, ...init }));
}

describe('useMagicKeys', () => {
	it('tracks individual keys case-insensitively', async () => {
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			expect(api.shift).toBe(false);
			keydown({ key: 'Shift' });
			expect(api.shift).toBe(true);
			expect(api.Shift).toBe(true);
			keyup({ key: 'Shift' });
			expect(api.shift).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('resolves aliases', async () => {
		expect(DefaultMagicKeysAliasMap.ctrl).toBe('control');
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			// Keys arm on first access (upstream laziness): read before pressing.
			expect(api.ctrl).toBe(false);
			keydown({ key: 'Control' });
			expect(api.ctrl).toBe(true);
			expect(api.control).toBe(true);
			keyup({ key: 'Control' });
			expect(api.ctrl).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('evaluates combinations live', async () => {
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			expect(api['control+a']).toBe(false);
			keydown({ key: 'Control' });
			expect(api['control+a']).toBe(false);
			keydown({ key: 'a' });
			expect(api['control+a']).toBe(true);
			expect(api['ctrl+a']).toBe(true);
			keyup({ key: 'a' });
			expect(api['control+a']).toBe(false);
			keyup({ key: 'Control' });
		} finally {
			await dispose();
		}
	});

	it('exposes the pressed set', async () => {
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			expect(api.keya).toBe(false);
			keydown({ key: 'a', code: 'KeyA' });
			expect(api.current.has('a')).toBe(true);
			expect(api.keya).toBe(true);
			keyup({ key: 'a', code: 'KeyA' });
			expect(api.current.has('a')).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('resets on blur', async () => {
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			expect(api.a).toBe(false);
			keydown({ key: 'a' });
			expect(api.a).toBe(true);
			window.dispatchEvent(new window.Event('blur'));
			expect(api.a).toBe(false);
			expect(api.current.size).toBe(0);
		} finally {
			await dispose();
		}
	});

	it('clears only keys pressed after shift on release', async () => {
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			expect(api.v).toBe(false);
			expect(api.e).toBe(false);
			expect(api.shift).toBe(false);
			keydown({ key: 'v' });
			keydown({ key: 'Shift', shiftKey: true });
			keydown({ key: 'e', shiftKey: true });
			expect(api.v).toBe(true);
			expect(api.e).toBe(true);
			keyup({ key: 'Shift' });
			expect(api.v).toBe(true);
			expect(api.e).toBe(false);
			expect(api.shift).toBe(false);
			keyup({ key: 'v' });
			keyup({ key: 'e' });
		} finally {
			await dispose();
		}
	});

	it('tolerates empty key events', async () => {
		const { api, dispose } = await mountUtil(() => useMagicKeys());
		try {
			expect(api.a).toBe(false);
			expect(() => {
				window.dispatchEvent(new window.KeyboardEvent('keyup', {}));
				window.dispatchEvent(new window.KeyboardEvent('keyup', { key: '' }));
			}).not.toThrow();
			expect(api.a).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('fires the event hook and honors a custom alias map', async () => {
		const onEventFired = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useMagicKeys({ onEventFired, aliasMap: { hyper: 'control' } })
		);
		try {
			expect(api.hyper).toBe(false);
			keydown({ key: 'Control' });
			expect(onEventFired).toHaveBeenCalledTimes(1);
			expect(api.hyper).toBe(true);
			keyup({ key: 'Control' });
			expect(onEventFired).toHaveBeenCalledTimes(2);
		} finally {
			await dispose();
		}
	});
});
