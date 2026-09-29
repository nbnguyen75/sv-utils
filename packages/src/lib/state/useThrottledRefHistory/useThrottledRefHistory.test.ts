// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useThrottledRefHistory } from './index.ts';

describe('useThrottledRefHistory', () => {
	it('commits at most once per window with the latest value', async () => {
		vi.useFakeTimers();
		const box = createBox(0);
		const { api, dispose } = await mountUtil(() => useThrottledRefHistory(box, { throttle: 200 }));
		try {
			box.value = 1;
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([1, 0]);
			box.value = 2;
			await tick();
			box.value = 3;
			await tick();
			expect(api.canUndo).toBe(true);
			vi.advanceTimersByTime(200);
			await tick();
			expect(api.history.map((record) => record.snapshot)).toEqual([3, 1, 0]);
		} finally {
			vi.useRealTimers();
			await dispose();
		}
	});
});
