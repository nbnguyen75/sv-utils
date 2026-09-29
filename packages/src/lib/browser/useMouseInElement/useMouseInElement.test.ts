// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useMouseInElement } from './index.ts';

function makeTarget(): HTMLElement {
	const element = document.createElement('div');
	element.getClientRects = () =>
		[{ left: 10, top: 20, width: 100, height: 50 }] as unknown as DOMRectList;
	document.body.appendChild(element);
	return element;
}

function move(x: number, y: number) {
	window.dispatchEvent(new window.MouseEvent('mousemove', { clientX: x, clientY: y }));
}

describe('useMouseInElement', () => {
	it('reports geometry and relative position', async () => {
		const element = makeTarget();
		const { api, dispose } = await mountUtil(() =>
			useMouseInElement(() => element, { type: 'client' })
		);
		try {
			move(30, 40);
			await tick();
			expect(api.elementPositionX).toBe(10);
			expect(api.elementPositionY).toBe(20);
			expect(api.elementWidth).toBe(100);
			expect(api.elementHeight).toBe(50);
			expect(api.elementX).toBe(20);
			expect(api.elementY).toBe(20);
			expect(api.isOutside).toBe(false);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('flags outside positions', async () => {
		const element = makeTarget();
		const { api, dispose } = await mountUtil(() =>
			useMouseInElement(() => element, { type: 'client' })
		);
		try {
			move(10000, 10000);
			await tick();
			expect(api.isOutside).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('freezes coordinates outside with handleOutside:false', async () => {
		const element = makeTarget();
		const { api, dispose } = await mountUtil(() =>
			useMouseInElement(() => element, { handleOutside: false, type: 'client' })
		);
		try {
			move(30, 40);
			await tick();
			expect(api.elementX).toBe(20);
			move(10000, 10000);
			await tick();
			expect(api.isOutside).toBe(true);
			expect(api.elementX).toBe(20);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('marks outside on document leave', async () => {
		const element = makeTarget();
		const { api, dispose } = await mountUtil(() =>
			useMouseInElement(() => element, { type: 'client' })
		);
		try {
			move(30, 40);
			await tick();
			expect(api.isOutside).toBe(false);
			document.dispatchEvent(new window.MouseEvent('mouseleave'));
			await tick();
			expect(api.isOutside).toBe(true);
		} finally {
			element.remove();
			await dispose();
		}
	});

	it('stop detaches updates', async () => {
		const element = makeTarget();
		const { api, dispose } = await mountUtil(() =>
			useMouseInElement(() => element, { type: 'client' })
		);
		try {
			move(30, 40);
			await tick();
			expect(api.elementX).toBe(20);
			api.stop();
			move(50, 60);
			await tick();
			expect(api.elementX).toBe(20);
		} finally {
			element.remove();
			await dispose();
		}
	});
});
