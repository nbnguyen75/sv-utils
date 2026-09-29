// @vitest-environment jsdom
import { tick } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { MockIntersectionObserver } from '../../../../test/fixtures/observers.ts';
import { useElementVisibility } from './index.ts';

function makeDiv(): HTMLElement {
	const element = document.createElement('div');
	document.body.appendChild(element);
	return element;
}

beforeEach(() => {
	MockIntersectionObserver.install();
});

describe('useElementVisibility', () => {
	it('starts at the initial value and follows intersections', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementVisibility(() => element));
		try {
			expect(api.value).toBe(false);
			MockIntersectionObserver.triggerIntersecting(element, true);
			await tick();
			expect(api.value).toBe(true);
			MockIntersectionObserver.triggerIntersecting(element, false);
			await tick();
			expect(api.value).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('honors a true initial value', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementVisibility(() => element, { initialValue: true })
		);
		try {
			expect(api.value).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stops tracking after the first visible report with once:true', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() =>
			useElementVisibility(() => element, { once: true })
		);
		try {
			MockIntersectionObserver.triggerIntersecting(element, true);
			await tick();
			expect(api.value).toBe(true);
			expect(api.isActive).toBe(false);
			expect(MockIntersectionObserver.instances.length).toBe(0);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('exposes pause/resume/stop controls', async () => {
		const element = makeDiv();
		const { api, dispose } = await mountUtil(() => useElementVisibility(() => element));
		try {
			expect(api.isSupported).toBe(true);
			api.pause();
			expect(api.isActive).toBe(false);
			api.resume();
			expect(api.isActive).toBe(true);
			api.stop();
			expect(api.isActive).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});
});
