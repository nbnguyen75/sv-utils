import { describe, expect, it, vi } from 'vitest';

import { refWithControl } from './index.ts';

describe('refWithControl', () => {
	it('reads and writes like normal state', () => {
		const cell = refWithControl(1);
		expect(cell.value).toBe(1);
		expect(cell.get()).toBe(1);
		cell.value = 2;
		expect(cell.get()).toBe(2);
		cell.set(3);
		expect(cell.value).toBe(3);
	});

	it('dismisses vetoed writes', () => {
		const changed = vi.fn();
		const cell = refWithControl(0, {
			onBeforeChange: (value) => (value < 0 ? false : undefined),
			onChanged: (...args) => changed(...args)
		});
		cell.value = -5;
		expect(cell.value).toBe(0);
		expect(changed).not.toHaveBeenCalled();
		cell.value = 5;
		expect(cell.value).toBe(5);
		expect(changed).toHaveBeenCalledTimes(1);
		expect(changed).toHaveBeenCalledWith(5, 0);
	});

	it('skips notifications for identical values', () => {
		const changed = vi.fn();
		const cell = refWithControl('a', { onChanged: () => changed() });
		cell.value = 'a';
		expect(changed).not.toHaveBeenCalled();
	});

	it('reads without tracking via untrackedGet and peek', () => {
		const cell = refWithControl({ n: 1 });
		expect(cell.untrackedGet()).toEqual({ n: 1 });
		expect(cell.peek()).toEqual({ n: 1 });
		expect(cell.get(false)).toEqual({ n: 1 });
	});
});
