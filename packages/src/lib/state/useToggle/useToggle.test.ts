/**
 * Tests for `useToggle`: default/custom values, explicit set, and
 * getter-based truthy/falsy values. Pure `$state` logic — node environment.
 */
import { describe, expect, it } from 'vitest';

import { useToggle } from './index.ts';

describe('useToggle', () => {
	it('toggles a boolean with false default', () => {
		const toggle = useToggle();
		expect(toggle.value).toBe(false);
		expect(toggle.toggle()).toBe(true);
		expect(toggle.value).toBe(true);
		expect(toggle.toggle()).toBe(false);
	});

	it('starts from an explicit initial value', () => {
		const toggle = useToggle(true);
		expect(toggle.value).toBe(true);
		toggle.toggle();
		expect(toggle.value).toBe(false);
	});

	it('sets an explicit value when an argument is passed', () => {
		const toggle = useToggle();
		expect(toggle.toggle(true)).toBe(true);
		expect(toggle.toggle(false)).toBe(false);
		// An explicit undefined is still an explicit set.
		toggle.toggle(undefined);
		expect(toggle.value).toBe(undefined);
	});

	it('supports custom truthy/falsy values', () => {
		const toggle = useToggle<string, string>('on', { falsyValue: 'off', truthyValue: 'on' });
		expect(toggle.value).toBe('on');
		toggle.toggle();
		expect(toggle.value).toBe('off');
		toggle.toggle();
		expect(toggle.value).toBe('on');
	});

	it('defaults to the falsy value when initial is omitted', () => {
		const toggle = useToggle<string, string>(undefined, {
			falsyValue: 'no',
			truthyValue: 'yes'
		});
		expect(toggle.value).toBe('no');
	});

	it('writes through the value setter', () => {
		const toggle = useToggle();
		toggle.value = true;
		expect(toggle.value).toBe(true);
	});

	it('resolves getter-based values at toggle time', () => {
		let mode = 'dark';
		const toggle = useToggle<string, string>('light', {
			falsyValue: () => 'light',
			truthyValue: () => mode
		});
		toggle.toggle();
		expect(toggle.value).toBe('dark');
		mode = 'dim';
		toggle.toggle();
		expect(toggle.value).toBe('dim');
		toggle.toggle();
		expect(toggle.value).toBe('light');
	});
});
