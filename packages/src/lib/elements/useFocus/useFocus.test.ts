// @vitest-environment jsdom
/**
 * Tests for `useFocus`: event tracking, programmatic focus/blur,
 * initial values, target swaps, and focus-visible mode.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useFocus } from './index.ts';

function makeInput(): HTMLInputElement {
	const element = document.createElement('input');
	document.body.appendChild(element);
	return element;
}

describe('useFocus', () => {
	it('tracks focus and blur events', async () => {
		const element = makeInput();
		const { api, dispose } = await mountUtil(() => useFocus(() => element));
		try {
			expect(api.focused).toBe(false);
			element.focus();
			await tick();
			expect(api.focused).toBe(true);
			element.blur();
			await tick();
			expect(api.focused).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('focuses and blurs programmatically through the setter', async () => {
		const element = makeInput();
		const { api, dispose } = await mountUtil(() => useFocus(() => element));
		try {
			api.focused = true;
			expect(document.activeElement).toBe(element);
			await tick();
			expect(api.focused).toBe(true);
			api.focused = false;
			expect(document.activeElement).not.toBe(element);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('ignores redundant setter writes', async () => {
		const element = makeInput();
		const { api, dispose } = await mountUtil(() => useFocus(() => element));
		try {
			api.focused = false;
			expect(document.activeElement).not.toBe(element);
			expect(api.focused).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('resets to the initial value when the target swaps', async () => {
		const first = makeInput();
		const second = makeInput();
		const box = createBox<HTMLElement | null>(first);
		const { api, dispose } = await mountUtil(() =>
			useFocus(() => box.value, { initialValue: true })
		);
		try {
			// Initial value applies to the first target on mount.
			expect(api.focused).toBe(true);
			box.value = second;
			await tick();
			expect(api.focused).toBe(true);
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('requires focus-visible matches in focusVisible mode', async () => {
		const element = makeInput();
		const { api, dispose } = await mountUtil(() => useFocus(() => element, { focusVisible: true }));
		try {
			element.focus();
			await tick();
			// jsdom matches :focus-visible on focused inputs: the mode path works.
			expect(element.matches(':focus-visible')).toBe(true);
			expect(api.focused).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});
});
