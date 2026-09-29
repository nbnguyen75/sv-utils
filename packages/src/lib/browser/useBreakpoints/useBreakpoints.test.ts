// @vitest-environment jsdom
/**
 * Tests for `useBreakpoints`: shortcuts, comparisons, current/active,
 * strategies, presets, and sync predicates.
 */
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { setMediaMatches } from '../../../../test/setup.ts';
import { breakpointsTailwind } from './breakpoints.ts';
import { useBreakpoints } from './index.ts';

const points = { sm: 640, lg: 1024 };

describe('useBreakpoints', () => {
	it('exposes mobile-first shortcuts per key', async () => {
		const { api, dispose } = await mountUtil(() => useBreakpoints(points));
		try {
			expect(api.sm.value).toBe(false);
			setMediaMatches('(min-width: 640px)', true);
			setMediaMatches('(min-width: 1024px)', true);
			await tick();
			expect(api.sm.value).toBe(true);
			expect(api.lg.value).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('compares with greater/smaller/between', async () => {
		// Factory queries install effects: build them in setup like real usage.
		const { api, dispose } = await mountUtil(() => {
			const breakpoints = useBreakpoints(points);
			return {
				breakpoints,
				greater: breakpoints.greater('lg'),
				smaller: breakpoints.smaller('sm'),
				between: breakpoints.between('sm', 'lg')
			};
		});
		try {
			setMediaMatches('(min-width: 1024.1px)', true);
			setMediaMatches('(max-width: 639.9px)', true);
			setMediaMatches('(min-width: 640px) and (max-width: 1023.9px)', true);
			await tick();
			expect(api.greater.value).toBe(true);
			expect(api.smaller.value).toBe(true);
			expect(api.between.value).toBe(true);
		} finally {
			await dispose();
		}
	});

	it('lists current matches and the active breakpoint', async () => {
		const { api, dispose } = await mountUtil(() => useBreakpoints(points));
		try {
			expect(api.current).toEqual([]);
			expect(api.active).toBe('');
			setMediaMatches('(min-width: 640px)', true);
			await tick();
			expect(api.current).toEqual(['sm']);
			expect(api.active).toBe('sm');
			setMediaMatches('(min-width: 1024px)', true);
			await tick();
			expect(api.current).toEqual(['sm', 'lg']);
			expect(api.active).toBe('lg');
		} finally {
			await dispose();
		}
	});

	it('supports desktop-first strategy', async () => {
		const { api, dispose } = await mountUtil(() =>
			useBreakpoints(points, { strategy: 'max-width' })
		);
		try {
			setMediaMatches('(max-width: 640px)', true);
			await tick();
			expect(api.sm.value).toBe(true);
			expect(api.active).toBe('sm');
		} finally {
			await dispose();
		}
	});

	it('answers synchronous predicates without reactivity', async () => {
		const { api, dispose } = await mountUtil(() => useBreakpoints(points));
		try {
			setMediaMatches('(min-width: 1024px)', true);
			setMediaMatches('(min-width: 1024.1px)', false);
			expect(api.isGreaterOrEqual('lg')).toBe(true);
			expect(api.isGreater('lg')).toBe(false);
			expect(api.isSmaller('lg')).toBe(false);
			expect(api.isSmallerOrEqual('sm')).toBe(false);
			expect(api.isInBetween('sm', 'lg')).toBe(false);
		} finally {
			await dispose();
		}
	});

	it('ships framework presets', () => {
		expect(breakpointsTailwind.lg).toBe(1024);
		expect(breakpointsTailwind.sm).toBe(640);
	});
});
