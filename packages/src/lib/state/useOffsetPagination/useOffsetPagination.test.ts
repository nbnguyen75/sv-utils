// @vitest-environment jsdom
/**
 * Tests for `useOffsetPagination`: page math, clamping, unbounded mode,
 * and change callbacks. Navigation is pure state; callbacks need component
 * context (mounted) since they are delivered via `$effect`.
 */
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useOffsetPagination } from './index.svelte.ts';
import type { UseOffsetPaginationOptions } from './index.svelte.ts';

const mountPagination = (
	options: UseOffsetPaginationOptions & { total: number | (() => number) }
) => mountUtil(() => useOffsetPagination(options));

describe('useOffsetPagination navigation', () => {
	it('paginates with defaults (pageSize 10, page 1)', () => {
		const pagination = useOffsetPagination({ total: 95 });
		expect(pagination.pageCount).toBe(10);
		expect(pagination.currentPage).toBe(1);
		expect(pagination.currentPageSize).toBe(10);
		expect(pagination.isFirstPage).toBe(true);
		expect(pagination.isLastPage).toBe(false);
	});

	it('navigates with clamping at both ends', () => {
		const pagination = useOffsetPagination({ total: 30 });
		pagination.prev();
		expect(pagination.currentPage).toBe(1);
		pagination.next();
		pagination.next();
		expect(pagination.currentPage).toBe(3);
		expect(pagination.isLastPage).toBe(true);
		pagination.next();
		expect(pagination.currentPage).toBe(3);
	});

	it('clamps direct page writes', () => {
		const pagination = useOffsetPagination({ total: 50 });
		pagination.currentPage = 99;
		expect(pagination.currentPage).toBe(5);
		pagination.currentPage = 0;
		expect(pagination.currentPage).toBe(1);
	});

	it('clamps page size to >= 1 and recomputes the count', () => {
		const pagination = useOffsetPagination({ total: 100 });
		pagination.currentPageSize = 0;
		expect(pagination.currentPageSize).toBe(1);
		expect(pagination.pageCount).toBe(100);
		pagination.currentPageSize = 25;
		expect(pagination.pageCount).toBe(4);
	});

	it('supports unbounded listings without a total', () => {
		const pagination = useOffsetPagination({});
		expect(pagination.pageCount).toBe(Number.POSITIVE_INFINITY);
		expect(pagination.isFirstPage).toBe(true);
		pagination.next();
		pagination.next();
		expect(pagination.currentPage).toBe(3);
	});

	it('respects initial page and size', () => {
		const pagination = useOffsetPagination({ page: 3, pageSize: 20, total: 100 });
		expect(pagination.currentPage).toBe(3);
		expect(pagination.pageCount).toBe(5);
	});

	it('clamps an out-of-range initial page on read', () => {
		const pagination = useOffsetPagination({ page: 99, total: 20 });
		expect(pagination.currentPage).toBe(2);
	});
});

describe('useOffsetPagination callbacks', () => {
	it('stays quiet on construction', async () => {
		const onPageChange = vi.fn();
		const onPageSizeChange = vi.fn();
		const onPageCountChange = vi.fn();
		const { dispose } = await mountPagination({
			onPageChange,
			onPageCountChange,
			onPageSizeChange,
			total: 100
		});
		try {
			await tick();
			expect(onPageChange).not.toHaveBeenCalled();
			expect(onPageSizeChange).not.toHaveBeenCalled();
			expect(onPageCountChange).not.toHaveBeenCalled();
		} finally {
			await dispose();
		}
	});

	it('fires onPageChange for real moves only', async () => {
		const onPageChange = vi.fn();
		const { api, dispose } = await mountPagination({ onPageChange, total: 30 });
		try {
			api.next();
			await tick();
			expect(onPageChange).toHaveBeenCalledTimes(1);
			expect(onPageChange.mock.calls[0]?.[0].currentPage).toBe(2);
			api.prev();
			await tick();
			expect(onPageChange).toHaveBeenCalledTimes(2);
			// Clamped no-op: still page 1, no callback.
			api.prev();
			await tick();
			expect(onPageChange).toHaveBeenCalledTimes(2);
		} finally {
			await dispose();
		}
	});

	it('fires size and count callbacks on size changes', async () => {
		const onPageSizeChange = vi.fn();
		const onPageCountChange = vi.fn();
		const { api, dispose } = await mountPagination({
			onPageCountChange,
			onPageSizeChange,
			total: 100
		});
		try {
			api.currentPageSize = 25;
			await tick();
			expect(onPageSizeChange).toHaveBeenCalledTimes(1);
			expect(onPageCountChange).toHaveBeenCalledTimes(1);
			expect(onPageCountChange.mock.calls[0]?.[0].pageCount).toBe(4);
		} finally {
			await dispose();
		}
	});

	it('fires count callbacks when a reactive total changes', async () => {
		const total = createBox(100);
		const onPageCountChange = vi.fn();
		const { api, dispose } = await mountPagination({
			onPageCountChange,
			total: () => total.value
		});
		try {
			expect(api.pageCount).toBe(10);
			total.value = 50;
			await tick();
			expect(api.pageCount).toBe(5);
			expect(onPageCountChange).toHaveBeenCalledTimes(1);
		} finally {
			await dispose();
		}
	});
});
