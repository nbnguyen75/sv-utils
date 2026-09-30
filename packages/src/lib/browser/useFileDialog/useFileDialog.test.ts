// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useFileDialog } from './index.ts';

function fileListOf(names: string[]): FileList {
	const files = names.map((name) => new window.File(['x'], name));
	const list = {
		length: files.length,
		item: (index: number) => files[index] ?? null,
		[Symbol.iterator]: function* () {
			yield* files;
		}
	} as unknown as FileList & Record<number, File>;
	for (const [index, file] of files.entries()) {
		list[index] = file as File;
	}
	return list as FileList;
}

describe('useFileDialog', () => {
	it('opens with applied options', async () => {
		const { api, dispose } = await mountUtil(() =>
			useFileDialog({ accept: 'image/*', multiple: false })
		);
		try {
			expect(api.files).toBeNull();
			const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
			try {
				api.open();
				expect(click).toHaveBeenCalledTimes(1);
			} finally {
				click.mockRestore();
			}
		} finally {
			await dispose();
		}
	});

	it('collects selected files and notifies', async () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		const seen: Array<FileList | null> = [];
		const { api, dispose } = await mountUtil(() => useFileDialog({ input: () => input }));
		try {
			api.onChange((files) => {
				seen.push(files);
			});
			Object.defineProperty(input, 'files', { configurable: true, value: fileListOf(['a.png']) });
			input.dispatchEvent(new window.Event('change'));
			expect(api.files?.length).toBe(1);
			expect(api.files?.[0]?.name).toBe('a.png');
			expect(seen.length).toBe(1);
		} finally {
			input.remove();
			await dispose();
		}
	});

	it('resets the selection', async () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		const seen: Array<FileList | null> = [];
		const { api, dispose } = await mountUtil(() => useFileDialog({ input: () => input }));
		try {
			api.onChange((files) => {
				seen.push(files);
			});
			Object.defineProperty(input, 'files', { configurable: true, value: fileListOf(['a.png']) });
			input.dispatchEvent(new window.Event('change'));
			expect(api.files?.length).toBe(1);
			api.reset();
			expect(api.files).toBeNull();
			// NOTE: the null notification requires a non-empty input value,
			// which file inputs never have in jsdom (real browsers set it
			// to a fakepath on selection).
			expect(seen.length).toBe(1);
		} finally {
			input.remove();
			await dispose();
		}
	});

	it('notifies cancellation', async () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		const cancelled = vi.fn();
		const { api, dispose } = await mountUtil(() => useFileDialog({ input: () => input }));
		try {
			const subscription = api.onCancel(cancelled);
			input.dispatchEvent(new window.Event('cancel'));
			// trigger() is async: let subscribers run.
			await Promise.resolve();
			await Promise.resolve();
			expect(cancelled).toHaveBeenCalledTimes(1);
			subscription.off();
		} finally {
			input.remove();
			await dispose();
		}
	});

	it('overrides options per open call', async () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		const click = vi.spyOn(input, 'click').mockImplementation(() => {});
		const { api, dispose } = await mountUtil(() =>
			useFileDialog({ input: () => input, accept: 'image/*' })
		);
		try {
			api.open({ accept: 'video/*', multiple: true });
			expect(click).toHaveBeenCalledTimes(1);
			expect(input.accept).toBe('video/*');
			expect(input.multiple).toBe(true);
		} finally {
			click.mockRestore();
			input.remove();
			await dispose();
		}
	});

	it('reset is safe when empty', async () => {
		const { api, dispose } = await mountUtil(() => useFileDialog());
		try {
			// Detached default input still opens (created, not attached).
			expect(api.files).toBeNull();
			api.reset();
			expect(api.files).toBeNull();
		} finally {
			await dispose();
		}
	});
});
