/**
 * Tests for `useAsyncQueue`: sequencing, interruption, hooks, abort,
 * and empty input. Framework-free — node environment.
 */
import { describe, expect, it, vi } from 'vitest';

import { useAsyncQueue } from './index.ts';

describe('useAsyncQueue', () => {
	it('runs tasks in sequence with previous results', async () => {
		const order: string[] = [];
		const queue = useAsyncQueue([
			() => {
				order.push('a');
				return Promise.resolve(1);
			},
			(previous: unknown) => {
				order.push('b');
				return Promise.resolve((previous as number) + 1);
			},
			(previous: unknown) => {
				order.push('c');
				return (previous as number) + 1;
			}
		]);
		expect(queue.activeIndex).toBe(-1);
		await Promise.resolve();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(order).toEqual(['a', 'b', 'c']);
		expect(queue.activeIndex).toBe(2);
		expect(queue.result.map((entry) => entry.state)).toEqual([
			'fulfilled',
			'fulfilled',
			'fulfilled'
		]);
		expect(queue.result.map((entry) => entry.data)).toEqual([1, 2, 3]);
	});

	it('interrupts remaining tasks on rejection by default', async () => {
		const onError = vi.fn();
		const onFinished = vi.fn();
		const third = vi.fn(() => Promise.resolve('never'));
		const queue = useAsyncQueue(
			[() => Promise.resolve('ok'), () => Promise.reject(new Error('fail')), third],
			{ onError, onFinished }
		);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(queue.result[0]?.state).toBe('fulfilled');
		expect(queue.result[1]?.state).toBe('rejected');
		expect(queue.result[2]?.state).toBe('pending');
		expect(third).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onFinished).toHaveBeenCalledTimes(1);
		expect(queue.activeIndex).toBe(1);
	});

	it('continues after failures with interrupt:false', async () => {
		const queue = useAsyncQueue(
			[() => Promise.reject(new Error('x')), () => Promise.resolve('recovered')],
			{ interrupt: false, onError: () => {} }
		);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(queue.result[0]?.state).toBe('rejected');
		expect(queue.result[1]?.state).toBe('fulfilled');
		expect(queue.result[1]?.data).toBe('recovered');
	});

	it('marks tasks aborted on a dead signal', async () => {
		const controller = new AbortController();
		controller.abort();
		const onFinished = vi.fn();
		const task = vi.fn(() => Promise.resolve('never'));
		const queue = useAsyncQueue([task], { onFinished, signal: controller.signal });
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(task).not.toHaveBeenCalled();
		expect(queue.result[0]?.state).toBe('aborted');
		expect(onFinished).toHaveBeenCalledTimes(1);
	});

	it('finishes immediately with no tasks', () => {
		const onFinished = vi.fn();
		const queue = useAsyncQueue([], { onFinished });
		expect(queue.activeIndex).toBe(-1);
		expect(queue.result).toEqual([]);
		expect(onFinished).toHaveBeenCalledTimes(1);
	});
});
