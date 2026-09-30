// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useObjectUrl } from './index.ts';

/** jsdom has no createObjectURL: stub the URL statics per test. */
function installObjectUrl(): { revoked: string[] } {
	const revoked: string[] = [];
	let counter = 0;
	URL.createObjectURL = vi.fn(
		() => `blob:fake-${(counter += 1)}`
	) as unknown as typeof URL.createObjectURL;
	URL.revokeObjectURL = vi.fn((url: string) => {
		revoked.push(url);
	}) as unknown as typeof URL.revokeObjectURL;
	return { revoked };
}

describe('useObjectUrl', () => {
	it('creates a URL for the object', async () => {
		installObjectUrl();
		const blob = new Blob(['x']);
		const { api, dispose } = await mountUtil(() => useObjectUrl(() => blob));
		try {
			expect(api.value).toBe('blob:fake-1');
		} finally {
			await dispose();
		}
	});

	it('revokes on change and on disposal', async () => {
		const { revoked } = installObjectUrl();
		// Drive the source through real reactive state so the watcher
		// re-runs (a plain reassigned variable would not notify).
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const url = useObjectUrl(() => (counter.count === 0 ? new Blob(['a']) : new Blob(['b'])));
			return { counter, url };
		});
		try {
			expect(api.url.value).toBe('blob:fake-1');
			api.counter.inc();
			await Promise.resolve();
			await Promise.resolve();
			expect(api.url.value).toBe('blob:fake-2');
			expect(revoked).toEqual(['blob:fake-1']);
		} finally {
			await dispose();
			expect(revoked).toEqual(['blob:fake-1', 'blob:fake-2']);
		}
	});

	it('clears for nullish sources', async () => {
		installObjectUrl();
		const { api, dispose } = await mountUtil(() => useObjectUrl(null));
		try {
			expect(api.value).toBeUndefined();
		} finally {
			await dispose();
		}
	});
});
