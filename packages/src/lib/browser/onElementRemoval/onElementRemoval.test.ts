// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useToggle } from '../../state/useToggle/index.ts';
import { onElementRemoval } from './index.ts';

async function flushMutations(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 10));
}

describe('onElementRemoval', () => {
	it('fires when the element itself is removed', async () => {
		const tooltip = document.createElement('div');
		document.body.appendChild(tooltip);
		const callback = vi.fn();
		const { dispose } = await mountUtil(() => onElementRemoval(() => tooltip, callback));
		try {
			tooltip.remove();
			await flushMutations();
			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback.mock.calls[0]?.[0]).toEqual(expect.any(Array));
		} finally {
			await dispose();
		}
	});

	it('fires when an ancestor is removed', async () => {
		const wrapper = document.createElement('section');
		const tooltip = document.createElement('div');
		wrapper.appendChild(tooltip);
		document.body.appendChild(wrapper);
		const callback = vi.fn();
		const { dispose } = await mountUtil(() => onElementRemoval(() => tooltip, callback));
		try {
			wrapper.remove();
			await flushMutations();
			expect(callback).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});

	it('ignores unrelated removals', async () => {
		const tooltip = document.createElement('div');
		const other = document.createElement('p');
		document.body.append(tooltip, other);
		const callback = vi.fn();
		const { dispose } = await mountUtil(() => onElementRemoval(() => tooltip, callback));
		try {
			other.remove();
			await flushMutations();
			expect(callback).not.toHaveBeenCalled();
		} finally {
			tooltip.remove();
			await dispose();
		}
	});

	it('follows getter target changes', async () => {
		const first = document.createElement('div');
		const second = document.createElement('div');
		document.body.append(first, second);
		const callback = vi.fn();
		// Drive the target through real reactive state so the watcher
		// re-subscribes (a plain reassigned variable would not notify).
		const { api, dispose } = await mountUtil(() => {
			const toggle = useToggle(false);
			const stop = onElementRemoval(() => (toggle.value ? second : first), callback);
			return { toggle, stop };
		});
		try {
			first.remove();
			await flushMutations();
			expect(callback).toHaveBeenCalledTimes(1);
			api.toggle.toggle();
			await flushMutations();
			second.remove();
			await flushMutations();
			expect(callback).toHaveBeenCalledTimes(2);
		} finally {
			first.remove();
			second.remove();
			await dispose();
		}
	});

	it('stop silences the watcher', async () => {
		const tooltip = document.createElement('div');
		document.body.appendChild(tooltip);
		const callback = vi.fn();
		const { api: stop, dispose } = await mountUtil(() => onElementRemoval(() => tooltip, callback));
		try {
			stop();
			tooltip.remove();
			await flushMutations();
			expect(callback).not.toHaveBeenCalled();
		} finally {
			await dispose();
		}
	});
});
