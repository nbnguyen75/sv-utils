// @vitest-environment jsdom
/**
 * Tests for `computedAsync`: evaluation, dep tracking, races, cancel
 * hooks, and errors. Runs mounted (evaluation in `$effect`).
 */
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { computedAsync } from './index.ts';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

function flush(times = 10) {
	let chain = Promise.resolve();
	for (let i = 0; i < times; i += 1) chain = chain.then(() => Promise.resolve());
	return chain;
}

describe('computedAsync', () => {
	it('evaluates on mount and reports status', async () => {
		const gate = deferred<number>();
		const { api, dispose } = await mountUtil(() => computedAsync(() => gate.promise, 0));
		try {
			expect(api.value).toBe(0);
			expect(api.evaluating).toBe(true);
			gate.resolve(20);
			await flush();
			expect(api.value).toBe(20);
			expect(api.evaluating).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('re-evaluates when dependencies change', async () => {
		const box = createBox(1);
		const gate = deferred<number>();
		let calls = 0;
		const { api, dispose } = await mountUtil(() =>
			computedAsync(() => {
				calls += 1;
				const seen = box.value;
				return gate.promise.then(() => seen + 1);
			}, 0)
		);
		try {
			gate.resolve(0);
			await flush();
			expect(api.value).toBe(2);
			expect(calls).toBe(1);
			box.value = 10;
			await flush();
			expect(api.value).toBe(11);
			expect(calls).toBe(2);
		} finally {
			await dispose();
		}
	});

	it('commits only the latest overlapping run', async () => {
		const box = createBox(0);
		const gate = deferred<string>();
		const { api, dispose } = await mountUtil(() =>
			computedAsync(() => {
				const seen = box.value;
				if (seen === 0) return gate.promise;
				return Promise.resolve(`fresh-${seen}`);
			}, 'init')
		);
		try {
			box.value = 1;
			await flush();
			expect(api.value).toBe('fresh-1');
			gate.resolve('stale');
			await flush();
			expect(api.value).toBe('fresh-1');
		} finally {
			await dispose();
		}
	});

	it('fires onCancel hooks for superseded runs', async () => {
		const box = createBox(0);
		const canceled = vi.fn();
		const gates: Array<() => void> = [];
		const { dispose } = await mountUtil(() =>
			computedAsync((onCancel) => {
				const seen = box.value;
				return new Promise<string>((resolve) => {
					onCancel(canceled);
					gates.push(() => resolve(`done-${seen}`));
				});
			}, 'init')
		);
		try {
			await flush();
			box.value = 1;
			await flush();
			expect(canceled).toHaveBeenCalledTimes(1);
			for (const release of gates) release();
			await flush();
		} finally {
			await dispose();
		}
	});

	it('reports errors and keeps the last value', async () => {
		const box = createBox(0);
		const onError = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			computedAsync(
				() => (box.value === 0 ? Promise.resolve('ok') : Promise.reject(new Error('bad'))),
				'init',
				{ onError }
			)
		);
		try {
			await flush();
			expect(api.value).toBe('ok');
			expect(api.evaluating).toBe(false);
			box.value = 1;
			await flush();
			expect(api.value).toBe('ok');
			expect(api.evaluating).toBe(false);
			expect(onError).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});
});
