// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useScrollLock } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

describe('useScrollLock', () => {
	it('locks and restores overflow through the setter', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useScrollLock(() => element));
		try {
			expect(api.value).toBe(false);
			api.value = true;
			expect(element.style.overflow).toBe('hidden');
			expect(api.value).toBe(true);
			api.value = false;
			expect(element.style.overflow).toBe('');
			expect(api.value).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('locks on mount with initialState', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useScrollLock(() => element, true));
		try {
			expect(api.value).toBe(true);
			expect(element.style.overflow).toBe('hidden');
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('restores a custom previous overflow', async () => {
		const element = makeDiv();
		element.style.overflow = 'auto';
		const { api, dispose } = await mountUtil(() => useScrollLock(() => element));
		try {
			api.value = true;
			expect(element.style.overflow).toBe('hidden');
			api.value = false;
			expect(element.style.overflow).toBe('auto');
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('adopts pre-hidden targets as locked', async () => {
		const element = makeDiv();
		element.style.overflow = 'hidden';
		const { api, dispose } = await mountUtil(() => useScrollLock(() => element));
		try {
			expect(api.value).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('unlocks on unmount', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useScrollLock(() => element));
		api.value = true;
		expect(element.style.overflow).toBe('hidden');
		await dispose();
		element.remove();
		expect(element.style.overflow).toBe('');
	});

	it('applies to swapped targets', async () => {
		const first = makeDiv();
		const second = makeDiv();
		const box = createBox<HTMLElement | null>(first);
		const { api, dispose } = await mountUtil(() => useScrollLock(() => box.value));
		try {
			api.value = true;
			expect(first.style.overflow).toBe('hidden');
			box.value = second;
			await tick();
			expect(second.style.overflow).toBe('hidden');
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('ignores null targets safely', async () => {
		const { api, dispose } = await mountUtil(() => useScrollLock(() => null));
		try {
			api.value = true;
			expect(api.value).toBe(false);
		} finally {
			await dispose();
		}
	});
});
