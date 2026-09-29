import { afterEach, describe, expect, it, vi } from 'vitest';

import { useThrottleFn } from './index.ts';

afterEach(() => {
	vi.useRealTimers();
});

describe('useThrottleFn', () => {
	it('invokes on the leading edge and once trailing with the latest args', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200);
		throttled('a');
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('a');
		throttled('b');
		throttled('c');
		expect(spy).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(200);
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith('c');
		// Window elapsed since the trailing fire: next call leads immediately.
		vi.advanceTimersByTime(200);
		throttled('d');
		expect(spy).toHaveBeenCalledTimes(3);
		expect(spy).toHaveBeenLastCalledWith('d');
	});

	it('with leading:false suppresses the first call and trails instead', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200, { leading: false });
		throttled('a');
		expect(spy).not.toHaveBeenCalled();
		vi.advanceTimersByTime(200);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('a');
		// After the trailing fire the window resets once it elapses.
		vi.advanceTimersByTime(200);
		throttled('b');
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith('b');
	});

	it('with trailing:false invokes at most once per window', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200, { trailing: false });
		throttled('a');
		throttled('b');
		throttled('c');
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('a');
		vi.advanceTimersByTime(500);
		expect(spy).toHaveBeenCalledTimes(1);
		throttled('d');
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith('d');
	});

	it('with neither edge drops calls inside the window (VueUse parity)', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200, { leading: false, trailing: false });
		throttled();
		vi.advanceTimersByTime(100);
		throttled();
		vi.advanceTimersByTime(100);
		expect(spy).not.toHaveBeenCalled();
		// Like VueUse `throttleFilter`, a call after a full quiet window
		// still invokes: edge suppression only applies inside a window.
		vi.advanceTimersByTime(500);
		throttled();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('invokes every call when interval is 0', () => {
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 0);
		throttled('a');
		throttled('b');
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('cancel drops the pending trailing call and resets the window', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200);
		throttled('a');
		throttled('b');
		throttled.cancel();
		throttled.cancel();
		vi.advanceTimersByTime(500);
		expect(spy).toHaveBeenCalledTimes(1);
		// Window reset: next call leads immediately.
		throttled('c');
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith('c');
	});

	it('flush invokes the pending trailing call now and prevents a second call', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200);
		throttled('a');
		throttled('b');
		throttled.flush();
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith('b');
		vi.advanceTimersByTime(500);
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('flush is a no-op when idle or after cancel', () => {
		const idle = vi.fn();
		useThrottleFn(idle, 200).flush();
		expect(idle).not.toHaveBeenCalled();

		vi.useFakeTimers();
		const spy = vi.fn();
		const throttled = useThrottleFn(spy, 200);
		throttled('a');
		throttled('b');
		throttled.cancel();
		throttled.flush();
		vi.advanceTimersByTime(500);
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
