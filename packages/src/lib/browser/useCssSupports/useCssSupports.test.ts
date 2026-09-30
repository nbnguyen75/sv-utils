// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useCssSupports } from './index.ts';

/** jsdom has no CSS.supports: install a recording fake. */
function installSupports(impl: (...args: string[]) => boolean = () => true): void {
	Object.defineProperty(window, 'CSS', {
		configurable: true,
		value: { supports: vi.fn(impl) }
	});
}

describe('useCssSupports', () => {
	it('queries property and value', async () => {
		installSupports(() => true);
		const { api, dispose } = await mountUtil(() => useCssSupports('display', 'grid'));
		try {
			expect(api.isSupported).toBe(true);
			expect(window.CSS.supports).toHaveBeenCalledWith('display', 'grid');
		} finally {
			await dispose();
		}
	});

	it('queries a bare condition', async () => {
		installSupports(() => false);
		const { api, dispose } = await mountUtil(() => useCssSupports('(display: grid)'));
		try {
			expect(api.isSupported).toBe(false);
			expect(window.CSS.supports).toHaveBeenCalledWith('(display: grid)');
		} finally {
			await dispose();
		}
	});

	it('re-queries when inputs change', async () => {
		installSupports(() => true);
		// Drive the property through real reactive state so the watcher
		// re-runs (a plain reassigned variable would not notify).
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const support = useCssSupports(() => `prop-${counter.count}`, 'x');
			return { counter, support };
		});
		try {
			// The getter evaluates lazily: read it before asserting calls.
			expect(api.support.isSupported).toBe(true);
			expect(window.CSS.supports).toHaveBeenLastCalledWith('prop-0', 'x');
			api.counter.inc();
			await tick();
			expect(api.support.isSupported).toBe(true);
			expect(window.CSS.supports).toHaveBeenLastCalledWith('prop-1', 'x');
		} finally {
			await dispose();
		}
	});

	it('reports false without the API', async () => {
		Object.defineProperty(window, 'CSS', { configurable: true, value: undefined });
		const { api, dispose } = await mountUtil(() => useCssSupports('display', 'grid'));
		try {
			expect(api.isSupported).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('supports a custom window', async () => {
		installSupports(() => true);
		const fake = { CSS: { supports: () => true } } as unknown as Window;
		const { api, dispose } = await mountUtil(() =>
			useCssSupports('display', 'grid', { window: fake })
		);
		try {
			expect(api.isSupported).toBe(true);
		} finally {
			await dispose();
		}
	});
});
