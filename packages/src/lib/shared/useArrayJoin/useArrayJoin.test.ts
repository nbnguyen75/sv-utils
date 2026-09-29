import { describe, expect, it } from 'vitest';

import { createBox } from '../../../../test/fixtures/box.svelte.ts';
import { useArrayJoin } from './index.ts';

describe('useArrayJoin', () => {
	it('joins with comma by default', () => {
		expect(useArrayJoin(['a', 'b', 'c']).value).toBe('a,b,c');
	});

	it('joins with a custom separator', () => {
		expect(useArrayJoin([1, 2, 3], ' - ').value).toBe('1 - 2 - 3');
	});

	it('resolves getter separators', () => {
		const box = createBox(' | ');
		const joined = useArrayJoin(['a', 'b'], () => box.value);
		expect(joined.value).toBe('a | b');
		box.value = '';
		expect(joined.value).toBe('ab');
	});

	it('returns an empty string for empty lists', () => {
		expect(useArrayJoin([]).value).toBe('');
	});

	it('reacts to source changes', () => {
		const box = createBox(['a']);
		const joined = useArrayJoin(() => box.value, '-');
		expect(joined.value).toBe('a');
		box.value = ['a', 'b'];
		expect(joined.value).toBe('a-b');
	});
});
