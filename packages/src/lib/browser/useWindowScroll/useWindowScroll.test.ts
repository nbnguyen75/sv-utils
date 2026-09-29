// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useWindowScroll } from './index.ts';

describe('useWindowScroll', () => {
	it('tracks window scroll position', async () => {
		const { api, dispose } = await mountUtil(() => useWindowScroll());
		try {
			expect(typeof api.x).toBe('number');
			expect(typeof api.y).toBe('number');
			api.measure();
			expect(api.arrivedState.top).toBe(true);
		} finally {
			await dispose();
		}
	});
});
