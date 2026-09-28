/**
 * Harness smoke test (node environment): proves DOM-less test runs,
 * `.svelte.ts` runes compilation, and fake-timer control over real
 * library modules.
 */
import { describe, expect, it, vi } from 'vitest';

import { isBrowser } from '../src/lib/shared/is.ts';
import { useDebounceFn } from '../src/lib/utilities/useDebounceFn/index.ts';
import { createCounter } from './fixtures/counter.svelte.ts';

describe('test harness (node)', () => {
	it('has no DOM globals and reports non-browser', () => {
		expect(typeof window).toBe('undefined');
		expect(isBrowser).toBe(false);
	});

	it('compiles and runs .svelte.ts runes modules', () => {
		const counter = createCounter(2);
		expect(counter.count).toBe(2);
		expect(counter.doubled).toBe(4);
		counter.increment(3);
		expect(counter.count).toBe(5);
		expect(counter.doubled).toBe(10);
		counter.reset();
		expect(counter.count).toBe(2);
	});

	it('controls timing with fake timers', () => {
		vi.useFakeTimers();
		try {
			const spy = vi.fn();
			const debounced = useDebounceFn(spy, 200);
			debounced();
			debounced();
			expect(spy).not.toHaveBeenCalled();
			vi.advanceTimersByTime(200);
			expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});
});
