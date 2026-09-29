// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useDebouncedRefHistory } from './index.ts';

describe('useDebouncedRefHistory', () => {
	it('coalesces bursts into one commit after quiet', async () => {
		vi.useFakeTimers();
		const box = createBox(0);
		const { api, dispose } = await mountUtil(() => useDebouncedRefHistory(box, { debounce: 200 }));
		try {
			box.value = 1;
			await tick();
			box.value = 2;
			await tick();
			expect(api.canUndo).toBe(false);
			vi.advanceTimersByTime(200);
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([2, 0]);
			api.undo();
			expect(box.value).toBe(0);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});
});
