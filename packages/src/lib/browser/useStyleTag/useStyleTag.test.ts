// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useStyleTag } from './index.ts';

function styled(id: string): HTMLStyleElement | null {
	return document.getElementById(id) as HTMLStyleElement | null;
}

describe('useStyleTag', () => {
	it('loads immediately with content', async () => {
		const { api, dispose } = await mountUtil(() =>
			useStyleTag('.a { color: red; }', { id: 'test-basic' })
		);
		try {
			expect(api.id).toBe('test-basic');
			expect(api.isLoaded).toBe(true);
			expect(styled('test-basic')?.textContent).toBe('.a { color: red; }');
			expect(api.css).toBe('.a { color: red; }');
		} finally {
			await dispose();
			expect(styled('test-basic')).toBeNull();
		}
	});

	it('re-applies when the CSS changes', async () => {
		// Drive the CSS through real reactive state so the watcher
		// re-runs (a plain reassigned variable would not notify).
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const tag = useStyleTag(() => `.x${counter.count} {}`, { id: 'test-reactive' });
			return { counter, tag };
		});
		try {
			expect(styled('test-reactive')?.textContent).toBe('.x0 {}');
			api.counter.inc();
			await tick();
			expect(styled('test-reactive')?.textContent).toBe('.x1 {}');
		} finally {
			await dispose();
		}
	});

	it('shares tags by id with ref-counting', async () => {
		const first = await mountUtil(() => useStyleTag('.a {}', { id: 'test-shared' }));
		const second = await mountUtil(() => useStyleTag('.b {}', { id: 'test-shared' }));
		try {
			expect(styled('test-shared')?.textContent).toBe('.b {}');
			first.api.unload();
			expect(styled('test-shared')).not.toBeNull();
			second.api.unload();
			expect(styled('test-shared')).toBeNull();
		} finally {
			await first.dispose();
			await second.dispose();
		}
	});

	it('stays manual when asked', async () => {
		const { api, dispose } = await mountUtil(() =>
			useStyleTag('.a {}', { id: 'test-manual', manual: true })
		);
		try {
			expect(api.isLoaded).toBe(false);
			expect(styled('test-manual')).toBeNull();
			api.load();
			expect(api.isLoaded).toBe(true);
			expect(styled('test-manual')).not.toBeNull();
			api.unload();
			expect(api.isLoaded).toBe(false);
			expect(styled('test-manual')).toBeNull();
		} finally {
			await dispose();
			expect(styled('test-manual')).toBeNull();
		}
	});

	it('applies nonce and media', async () => {
		const { dispose } = await mountUtil(() =>
			useStyleTag('.a {}', { id: 'test-attrs', nonce: 'n-1', media: 'print' })
		);
		try {
			const element = styled('test-attrs');
			expect(element?.nonce).toBe('n-1');
			expect(element?.media).toBe('print');
		} finally {
			await dispose();
		}
	});
});
