// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useCssVar } from './index.ts';

async function settle(): Promise<void> {
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 10));
	await tick();
}

describe('useCssVar', () => {
	it('reads the computed value on mount', async () => {
		const card = document.createElement('div');
		card.style.setProperty('--brand', 'red');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() =>
			useCssVar(
				() => '--brand',
				() => card
			)
		);
		try {
			await settle();
			expect(api.value).toBe('red');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('writes through the setter', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() =>
			useCssVar(
				() => '--brand',
				() => card
			)
		);
		try {
			api.value = 'blue';
			await settle();
			expect(card.style.getPropertyValue('--brand')).toBe('blue');
			expect(api.value).toBe('blue');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('removes the property for nullish values', async () => {
		const card = document.createElement('div');
		card.style.setProperty('--brand', 'red');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() =>
			useCssVar(
				() => '--brand',
				() => card
			)
		);
		try {
			await settle();
			expect(api.value).toBe('red');
			api.value = undefined;
			await settle();
			expect(card.style.getPropertyValue('--brand')).toBe('');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('drops the old property when the name changes', async () => {
		const card = document.createElement('div');
		card.style.setProperty('--a', '1');
		card.style.setProperty('--b', '2');
		document.body.appendChild(card);
		// Drive the name through real reactive state so the watcher
		// re-runs (a plain reassigned variable would not notify).
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const variable = useCssVar(
				() => (counter.count === 0 ? '--a' : '--b'),
				() => card
			);
			return { counter, variable };
		});
		try {
			await settle();
			expect(api.variable.value).toBe('1');
			api.counter.inc();
			await settle();
			expect(card.style.getPropertyValue('--a')).toBe('');
			expect(api.variable.value).toBe('2');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('picks up external changes when observing', async () => {
		const card = document.createElement('div');
		card.style.setProperty('--brand', 'red');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() =>
			useCssVar(
				() => '--brand',
				() => card,
				{ observe: true }
			)
		);
		try {
			await settle();
			expect(api.value).toBe('red');
			card.style.setProperty('--brand', 'green');
			await settle();
			expect(api.value).toBe('green');
		} finally {
			card.remove();
			await dispose();
		}
	});

	it('falls back to the initial value', async () => {
		const card = document.createElement('div');
		document.body.appendChild(card);
		const { api, dispose } = await mountUtil(() =>
			useCssVar(
				() => '--missing',
				() => card,
				{ initialValue: 'fallback' }
			)
		);
		try {
			await settle();
			expect(api.value).toBe('fallback');
		} finally {
			card.remove();
			await dispose();
		}
	});
});
