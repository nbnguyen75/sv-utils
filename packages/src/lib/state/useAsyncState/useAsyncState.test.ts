/**
 * Tests for `useAsyncState`: lifecycle flags, args, races, errors,
 * options, and awaitability. Promise-only — node environment.
 */
import { describe, expect, it, vi } from 'vitest';

import { useAsyncState } from './index.ts';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

describe('useAsyncState', () => {
	it('executes immediately and settles flags', async () => {
		const state = useAsyncState(Promise.resolve(42), 0);
		expect(state.isLoading).toBe(true);
		expect(state.isReady).toBe(false);
		await state;
		expect(state.state).toBe(42);
		expect(state.isReady).toBe(true);
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeUndefined();
	});

	it('stays idle with immediate:false until executed', async () => {
		const state = useAsyncState(Promise.resolve(1), 0, { immediate: false });
		expect(state.isLoading).toBe(false);
		expect(state.state).toBe(0);
		const pending = state.execute();
		expect(state.isLoading).toBe(true);
		await pending;
		expect(state.state).toBe(1);
	});

	it('forwards execute arguments to the factory', async () => {
		const factory = vi.fn(async (id: number) => id * 2);
		const state = useAsyncState(factory, 0, { immediate: false });
		await state.executeImmediate(21);
		expect(factory).toHaveBeenCalledWith(21);
		expect(state.state).toBe(42);
	});

	it('drops stale executions but still reports them', async () => {
		const slow = deferred<string>();
		const fast = deferred<string>();
		let calls = 0;
		const onSuccess = vi.fn();
		const state = useAsyncState(
			() => {
				calls += 1;
				return calls === 1 ? slow.promise : fast.promise;
			},
			'init',
			{ immediate: false, onSuccess }
		);
		const first = state.execute();
		const second = state.execute();
		fast.resolve('fast');
		await second;
		expect(state.state).toBe('fast');
		expect(state.isReady).toBe(true);
		slow.resolve('slow');
		await first;
		expect(state.state).toBe('fast');
		expect(onSuccess).toHaveBeenCalledTimes(2);
	});

	it('captures errors without throwing by default', async () => {
		const failure = new Error('nope');
		const onError = vi.fn();
		const state = useAsyncState(Promise.reject<string>(failure), 'init', {
			immediate: false,
			onError
		});
		await expect(state.execute()).resolves.toBeUndefined();
		expect(state.error).toBe(failure);
		expect(state.isReady).toBe(false);
		expect(state.isLoading).toBe(false);
		expect(state.state).toBe('init');
		expect(onError).toHaveBeenCalledWith(failure);
	});

	it('rethrows with throwError', async () => {
		const failure = new Error('boom');
		const state = useAsyncState(Promise.reject<string>(failure), 'init', {
			immediate: false,
			throwError: true,
			onError: () => {}
		});
		await expect(state.execute()).rejects.toBe(failure);
		expect(state.error).toBe(failure);
	});

	it('keeps state during reload with resetOnExecute:false', async () => {
		const gate = deferred<number>();
		const state = useAsyncState(() => gate.promise, 1, {
			immediate: false,
			resetOnExecute: false
		});
		state.execute();
		expect(state.state).toBe(1);
		gate.resolve(2);
		await state;
		expect(state.state).toBe(2);
	});

	it('delays execution and resolves getter initials', async () => {
		vi.useFakeTimers();
		try {
			const factory = vi.fn(async () => 'done');
			const state = useAsyncState(factory, () => 'init', { immediate: false });
			expect(state.state).toBe('init');
			const pending = state.execute(100);
			expect(factory).not.toHaveBeenCalled();
			vi.advanceTimersByTime(100);
			await pending;
			expect(state.state).toBe('done');
		} finally {
			vi.useRealTimers();
		}
	});
});
