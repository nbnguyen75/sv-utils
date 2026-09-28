/**
 * Tests for `useCounter`: counting, clamping, get/set/reset.
 * Pure `$state` logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { useCounter } from './index.ts';

describe('useCounter', () => {
	it('counts from zero by default', () => {
		const counter = useCounter();
		expect(counter.count).toBe(0);
		counter.inc();
		expect(counter.count).toBe(1);
		counter.dec();
		expect(counter.count).toBe(0);
	});

	it('starts from an initial value or getter', () => {
		expect(useCounter(10).count).toBe(10);
		expect(useCounter(() => 7).count).toBe(7);
	});

	it('increments and decrements by delta', () => {
		const counter = useCounter(5);
		counter.inc(3);
		expect(counter.count).toBe(8);
		counter.dec(10);
		expect(counter.count).toBe(-2);
	});

	it('clamps to min/max on inc/dec/set', () => {
		const counter = useCounter(5, { max: 10, min: 0 });
		counter.inc(100);
		expect(counter.count).toBe(10);
		counter.dec(100);
		expect(counter.count).toBe(0);
		counter.set(50);
		expect(counter.count).toBe(10);
		counter.set(-50);
		expect(counter.count).toBe(0);
	});

	it('reads and writes via get/set', () => {
		const counter = useCounter();
		counter.set(42);
		expect(counter.get()).toBe(42);
		expect(counter.count).toBe(42);
	});

	it('resets to the initial value, or redefines it', () => {
		const counter = useCounter(3);
		counter.set(99);
		counter.reset();
		expect(counter.count).toBe(3);
		counter.reset(10);
		expect(counter.count).toBe(10);
		counter.set(99);
		counter.reset();
		expect(counter.count).toBe(10);
	});

	it('reset honors bounds', () => {
		const counter = useCounter(0, { max: 5 });
		counter.reset(100);
		expect(counter.count).toBe(5);
	});
});
