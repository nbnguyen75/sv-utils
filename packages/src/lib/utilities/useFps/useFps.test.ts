// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { mockRaf } from '../../../../test/fixtures/raf.ts';
import type { ManualRaf } from '../../../../test/fixtures/raf.ts';
import { useFps } from './index.ts';

let nowValue = 1000;

function installClock() {
	nowValue = 1000;
	vi.spyOn(performance, 'now').mockImplementation(() => nowValue);
}

function stepFrames(raf: ManualRaf, count: number, gap: number) {
	for (let i = 0; i < count; i += 1) {
		nowValue += gap;
		raf.step(nowValue);
	}
}

describe('useFps', () => {
	it('samples fps over the every-window', async () => {
		installClock();
		const raf = mockRaf();
		const { api, dispose } = await mountUtil(() => useFps());
		try {
			expect(api.value).toBe(0);
			stepFrames(raf, 10, 16);
			// 10 frames over 160ms -> round(1000 / 16) = 63 (.5 rounds up).
			expect(api.value).toBe(63);
			stepFrames(raf, 10, 32);
			// 10 frames over 320ms -> round(1000 / 32) = 31.
			expect(api.value).toBe(31);
		} finally {
			await dispose();
		}
	});

	it('honors a custom every window', async () => {
		installClock();
		const raf = mockRaf();
		const { api, dispose } = await mountUtil(() => useFps({ every: 5 }));
		try {
			stepFrames(raf, 5, 20);
			// 5 frames over 100ms -> round(1000 / 20) = 50.
			expect(api.value).toBe(50);
		} finally {
			await dispose();
		}
	});

	it('returns zero without starting a loop when performance is missing', async () => {
		const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
		Object.defineProperty(globalThis, 'performance', { configurable: true, value: undefined });
		try {
			const { api, dispose } = await mountUtil(() => useFps());
			try {
				expect(api.value).toBe(0);
			} finally {
				await dispose();
			}
		} finally {
			if (descriptor) Object.defineProperty(globalThis, 'performance', descriptor);
		}
	});

	it('stops sampling on unmount', async () => {
		installClock();
		const raf = mockRaf();
		const { api, dispose } = await mountUtil(() => useFps());
		stepFrames(raf, 10, 16);
		expect(api.value).toBe(63);
		await dispose();
		stepFrames(raf, 10, 16);
		expect(api.value).toBe(63);
	});
});
