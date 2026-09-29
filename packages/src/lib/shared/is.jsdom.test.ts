// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { isElement } from './is.ts';

describe('isElement (jsdom)', () => {
	it('detects elements without instanceof', () => {
		expect(isElement(document.createElement('div'))).toBe(true);
		expect(isElement(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))).toBe(true);
		expect(isElement(null)).toBe(false);
		expect(isElement(undefined)).toBe(false);
		expect(isElement(window)).toBe(false);
		expect(isElement(document)).toBe(false);
		expect(isElement(document.createTextNode('x'))).toBe(false);
		expect(isElement({ nodeType: 1 })).toBe(false);
		expect(isElement('div')).toBe(false);
	});
});
