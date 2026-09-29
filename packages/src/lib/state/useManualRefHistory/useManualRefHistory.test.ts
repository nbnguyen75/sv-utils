/**
 * Tests for `useManualRefHistory`: stacks, undo/redo, capacity, codecs,
 * clear/reset, and custom writers. Pure state — node environment.
 */
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useManualRefHistory } from './index.ts';

describe('useManualRefHistory', () => {
	it('commits, undoes, and redoes in order', () => {
		const box = createBox(1);
		const history = useManualRefHistory(box);
		expect(history.canUndo).toBe(false);
		expect(history.canRedo).toBe(false);
		expect(history.history.map((record) => record.snapshot)).toEqual([1]);

		box.value = 2;
		history.commit();
		box.value = 3;
		history.commit();

		expect(history.history.map((record) => record.snapshot)).toEqual([3, 2, 1]);
		expect(history.canUndo).toBe(true);

		history.undo();
		expect(box.value).toBe(2);
		expect(history.canRedo).toBe(true);
		history.undo();
		expect(box.value).toBe(1);
		expect(history.canUndo).toBe(false);
		history.redo();
		expect(box.value).toBe(2);
	});

	it('clears redo on new commits and resets to latest', () => {
		const box = createBox('a');
		const history = useManualRefHistory(box);
		box.value = 'b';
		history.commit();
		history.undo();
		expect(box.value).toBe('a');
		box.value = 'c';
		history.commit();
		expect(history.canRedo).toBe(false);
		history.reset();
		expect(box.value).toBe('c');
	});

	it('clears all records', () => {
		const box = createBox(1);
		const history = useManualRefHistory(box);
		box.value = 2;
		history.commit();
		history.clear();
		expect(history.canUndo).toBe(false);
		expect(history.canRedo).toBe(false);
		expect(history.history.map((record) => record.snapshot)).toEqual([2]);
	});

	it('trims the undo stack at capacity', () => {
		const box = createBox(0);
		const history = useManualRefHistory(box, { capacity: 2 });
		for (let value = 1; value <= 4; value += 1) {
			box.value = value;
			history.commit();
		}
		expect(history.history.map((record) => record.snapshot)).toEqual([4, 3, 2]);
	});

	it('clones snapshots so later mutations do not leak in', () => {
		const box = createBox({ n: 1 });
		const history = useManualRefHistory(box, { clone: true });
		history.commit();
		box.value.n = 99;
		history.undo();
		expect(box.value).toEqual({ n: 1 });
	});

	it('round-trips through custom dump/parse codecs', () => {
		const box = createBox(1);
		const history = useManualRefHistory<number, string>(box, {
			dump: (value) => `v${value}`,
			parse: (snapshot) => Number(snapshot.slice(1))
		});
		box.value = 2;
		history.commit();
		expect(history.last.snapshot).toBe('v2');
		history.undo();
		expect(box.value).toBe(1);
	});

	it('writes through a custom setSource', () => {
		const box = createBox(1);
		const writer = vi.fn((value: number) => {
			box.value = value * 10;
		});
		const history = useManualRefHistory(box, { setSource: writer });
		box.value = 2;
		history.commit();
		history.undo();
		expect(writer).toHaveBeenCalledWith(1);
		expect(box.value).toBe(10);
	});

	it('stamps records with timestamps', () => {
		const before = Date.now();
		const history = useManualRefHistory(createBox(1));
		expect(history.last.timestamp).toBeGreaterThanOrEqual(before);
		expect(history.last.timestamp).toBeLessThanOrEqual(Date.now());
	});
});
