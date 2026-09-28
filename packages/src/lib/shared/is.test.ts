/**
 * Tests for the shared environment flags and type guards (`is.ts`).
 * Runs in node: asserts SSR-safe defaults (no DOM globals at import).
 */
import { describe, expect, it, vi } from 'vitest';

import {
	assert,
	clamp,
	hasOwn,
	isBrowser,
	isClient,
	isDef,
	isIOS,
	isObject,
	isWorker,
	noop,
	notNullish,
	now,
	rand,
	timestamp
} from './is.ts';

describe('shared guards (node / SSR)', () => {
	it('reports a non-browser, non-worker environment', () => {
		expect(typeof window).toBe('undefined');
		expect(isBrowser).toBe(false);
		expect(isClient).toBe(false);
		expect(isWorker).toBe(false);
		expect(isIOS).toBe(false);
	});

	it('isDef treats everything except undefined as defined', () => {
		expect(isDef(undefined)).toBe(false);
		expect(isDef(null)).toBe(true);
		expect(isDef(0)).toBe(true);
		expect(isDef('')).toBe(true);
		expect(isDef(false)).toBe(true);
	});

	it('notNullish rejects null and undefined only', () => {
		expect(notNullish(undefined)).toBe(false);
		expect(notNullish(null)).toBe(false);
		expect(notNullish(0)).toBe(true);
		expect(notNullish('')).toBe(true);
		expect(notNullish(false)).toBe(true);
		expect(notNullish(Number.NaN)).toBe(true);
	});

	it('assert stays silent on true and warns with infos on false', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		assert(true, 'never');
		expect(warn).not.toHaveBeenCalled();
		assert(false, 'reason', { code: 1 });
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith('reason', { code: 1 });
	});

	it('isObject matches plain objects only', () => {
		expect(isObject({})).toBe(true);
		expect(isObject({ a: 1 })).toBe(true);
		expect(isObject(Object.create(null))).toBe(true);
		expect(isObject([])).toBe(false);
		expect(isObject(null)).toBe(false);
		expect(isObject(undefined)).toBe(false);
		expect(isObject('x')).toBe(false);
		expect(isObject(1)).toBe(false);
		expect(isObject(() => {})).toBe(false);
		expect(isObject(new Date())).toBe(false);
		expect(isObject(/re/)).toBe(false);
	});

	it('now and timestamp return epoch milliseconds', () => {
		const before = Date.now();
		const n = now();
		const t = timestamp();
		const after = Date.now();
		expect(Number.isInteger(n)).toBe(true);
		expect(Number.isInteger(t)).toBe(true);
		expect(n).toBeGreaterThanOrEqual(before);
		expect(t).toBeGreaterThanOrEqual(n);
		expect(after).toBeGreaterThanOrEqual(t);
	});

	it('clamp bounds values inclusively', () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-5, 0, 10)).toBe(0);
		expect(clamp(15, 0, 10)).toBe(10);
		expect(clamp(0, 0, 10)).toBe(0);
		expect(clamp(10, 0, 10)).toBe(10);
		expect(clamp(7, 7, 7)).toBe(7);
	});

	it('noop returns undefined', () => {
		expect(noop()).toBeUndefined();
	});

	it('rand returns integers inside the inclusive range', () => {
		expect(rand(1, 1)).toBe(1);
		for (let i = 0; i < 200; i += 1) {
			const value = rand(2, 5);
			expect(Number.isInteger(value)).toBe(true);
			expect(value).toBeGreaterThanOrEqual(2);
			expect(value).toBeLessThanOrEqual(5);
		}
	});

	it('hasOwn detects own properties only', () => {
		expect(hasOwn({ a: 1 }, 'a')).toBe(true);
		expect(hasOwn({ a: 1 }, 'b')).toBe(false);
		expect(hasOwn({}, 'toString')).toBe(false);
		expect(hasOwn(['x'], '0')).toBe(true);
		expect(hasOwn(['x'], 'length')).toBe(true);
	});
});
