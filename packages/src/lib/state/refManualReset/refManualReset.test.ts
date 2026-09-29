/**
 * Tests for `refManualReset`: writes, resets, getter defaults.
 * Pure `$state` logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { refManualReset } from './index.ts';

describe('refManualReset', () => {
	it('starts at the default and writes freely', () => {
		const cell = refManualReset('idle');
		expect(cell.value).toBe('idle');
		cell.value = 'busy';
		expect(cell.value).toBe('busy');
	});

	it('reset restores the default without auto behavior', () => {
		const cell = refManualReset(0);
		cell.value = 42;
		cell.reset();
		expect(cell.value).toBe(0);
		cell.value = 7;
		expect(cell.value).toBe(7);
	});

	it('re-resolves a getter default on every reset', () => {
		let fallback = 'a';
		const cell = refManualReset(() => fallback);
		cell.value = 'x';
		fallback = 'b';
		cell.reset();
		expect(cell.value).toBe('b');
	});
});
