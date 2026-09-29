// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useRefHistory } from './index.ts';

describe('useRefHistory', () => {
	it('commits changes automatically with undo/redo', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountUtil(() => useRefHistory(box));
		try {
			expect(api.isTracking).toBe(true);
			box.value = 2;
			await tick();
			box.value = 3;
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([3, 2, 1]);
			api.undo();
			expect(box.value).toBe(2);
			expect(api.canRedo).toBe(true);
			api.redo();
			expect(box.value).toBe(3);
		} finally {
			await dispose();
		}
	});

	it('pauses and resumes, optionally committing', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountUtil(() => useRefHistory(box));
		try {
			api.pause();
			expect(api.isTracking).toBe(false);
			box.value = 2;
			await tick();
			expect(api.canUndo).toBe(false);
			api.resume();
			box.value = 3;
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([3, 1]);
			api.pause();
			box.value = 4;
			await tick();
			api.resume(true);
			expect(api.history.map((record) => record.snapshot)).toEqual([4, 3, 1]);
		} finally {
			await dispose();
		}
	});

	it('batches silenced writes into one commit, unless canceled', async () => {
		const box = createBox(0);
		const { api, dispose } = await mountUtil(() => useRefHistory(box));
		try {
			api.batch(() => {
				box.value = 1;
				box.value = 2;
			});
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([2, 0]);
			api.batch((cancel) => {
				box.value = 3;
				cancel();
			});
			await tick();
			// Canceled batch: value stays (writes are not rolled back),
			// but no record is committed.
			expect(box.value).toBe(3);
			expect(api.history.map((record) => record.snapshot)).toEqual([2, 0]);
		} finally {
			await dispose();
		}
	});

	it('dispose stops tracking and clears records', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountUtil(() => useRefHistory(box));
		try {
			box.value = 2;
			await tick();
			expect(api.canUndo).toBe(true);
			api.dispose();
			expect(api.canUndo).toBe(false);
			box.value = 3;
			await tick();
			expect(api.canUndo).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('honors shouldCommit vetoes', async () => {
		const box = createBox(0);
		const { api, dispose } = await mountUtil(() =>
			useRefHistory(box, { shouldCommit: (_old, next) => next % 2 === 0 })
		);
		try {
			box.value = 1;
			await tick();
			expect(api.canUndo).toBe(false);
			box.value = 2;
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([2, 0]);
		} finally {
			await dispose();
		}
	});

	it('tracks nested mutations with deep:true', async () => {
		const box = createBox({ nested: { count: 0 } });
		const { api, dispose } = await mountUtil(() => useRefHistory(box, { clone: true, deep: true }));
		try {
			box.value.nested.count = 1;
			await tick();
			expect(api.canUndo).toBe(true);
			api.undo();
			expect(box.value).toEqual({ nested: { count: 0 } });
		} finally {
			await dispose();
		}
	});

	it('ignores silent programmatic writes', async () => {
		const box = createBox(1);
		const { api, dispose } = await mountUtil(() => useRefHistory(box));
		try {
			api.ignoreUpdates(() => {
				box.value = 99;
			});
			await tick();
			expect(api.canUndo).toBe(false);
			expect(box.value).toBe(99);
		} finally {
			await dispose();
		}
	});
});
