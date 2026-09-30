// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useDropZone } from './index.ts';

interface FakeTransfer {
	files: File[];
	items: Array<{ type: string }>;
	types: string[];
	dropEffect: string;
}

/** jsdom cannot construct DataTransfer: attach a structural fake. */
function dragEvent(type: string, transfer: Partial<FakeTransfer> = {}): DragEvent {
	const event = new window.Event(type, { bubbles: true, cancelable: true }) as DragEvent;
	Object.defineProperty(event, 'dataTransfer', {
		value: { files: [], items: [], types: [], dropEffect: 'none', ...transfer }
	});
	return event;
}

function file(name: string, type: string): File {
	return new window.File(['content'], name, { type });
}

const png = () => file('a.png', 'image/png');
const text = () => file('b.txt', 'text/plain');

describe('useDropZone', () => {
	it('collects dropped files and fires onDrop', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const onDrop = vi.fn();
		const { api, dispose } = await mountUtil(() => useDropZone(() => zone, { onDrop }));
		try {
			zone.dispatchEvent(
				dragEvent('drop', {
					files: [png(), text()],
					items: [{ type: 'image/png' }, { type: 'text/plain' }]
				})
			);
			expect(api.files?.map((item) => item.name)).toEqual(['a.png', 'b.txt']);
			expect(onDrop).toHaveBeenCalledTimes(1);
			expect(api.isOverDropZone).toBe(false);
		} finally {
			zone.remove();
			await dispose();
		}
	});

	it('tracks hover with a nested counter', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const onEnter = vi.fn();
		const onLeave = vi.fn();
		const { api, dispose } = await mountUtil(() => useDropZone(() => zone, { onEnter, onLeave }));
		try {
			expect(api.isOverDropZone).toBe(false);
			zone.dispatchEvent(dragEvent('dragenter', { items: [{ type: 'image/png' }] }));
			zone.dispatchEvent(dragEvent('dragenter', { items: [{ type: 'image/png' }] }));
			expect(api.isOverDropZone).toBe(true);
			expect(onEnter).toHaveBeenCalledTimes(2);
			zone.dispatchEvent(dragEvent('dragleave'));
			expect(api.isOverDropZone).toBe(true);
			zone.dispatchEvent(dragEvent('dragleave'));
			expect(api.isOverDropZone).toBe(false);
			expect(onLeave).toHaveBeenCalledTimes(2);
		} finally {
			zone.remove();
			await dispose();
		}
	});

	it('rejects disallowed data types', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const onDrop = vi.fn();
		const { api, dispose } = await mountUtil(() =>
			useDropZone(() => zone, { dataTypes: ['image'], onDrop })
		);
		try {
			const event = dragEvent('drop', { files: [text()], items: [{ type: 'text/plain' }] });
			zone.dispatchEvent(event);
			expect(api.files).toBeNull();
			expect(onDrop).not.toHaveBeenCalled();
			expect(event.dataTransfer?.dropEffect).toBe('none');
		} finally {
			zone.remove();
			await dispose();
		}
	});

	it('accepts a data-type predicate', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const { api, dispose } = await mountUtil(() =>
			useDropZone(() => zone, { dataTypes: (types) => types.includes('text/plain') })
		);
		try {
			zone.dispatchEvent(dragEvent('drop', { files: [text()], items: [{ type: 'text/plain' }] }));
			expect(api.files?.map((item) => item.name)).toEqual(['b.txt']);
		} finally {
			zone.remove();
			await dispose();
		}
	});

	it('limits to one file when multiple is false', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const { api, dispose } = await mountUtil(() => useDropZone(() => zone, { multiple: false }));
		try {
			zone.dispatchEvent(
				dragEvent('drop', {
					files: [png(), text()],
					items: [{ type: 'image/png' }, { type: 'text/plain' }]
				})
			);
			// Two items with multiple: false is invalid: nothing lands.
			expect(api.files).toBeNull();
			zone.dispatchEvent(dragEvent('drop', { files: [png()], items: [{ type: 'image/png' }] }));
			expect(api.files?.map((item) => item.name)).toEqual(['a.png']);
		} finally {
			zone.remove();
			await dispose();
		}
	});

	it('accepts the onDrop shorthand', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const onDrop = vi.fn();
		const { api, dispose } = await mountUtil(() => useDropZone(() => zone, onDrop));
		try {
			zone.dispatchEvent(dragEvent('drop', { files: [png()], items: [{ type: 'image/png' }] }));
			expect(onDrop).toHaveBeenCalledTimes(1);
			expect(api.files?.map((item) => item.name)).toEqual(['a.png']);
		} finally {
			zone.remove();
			await dispose();
		}
	});

	it('honors a custom validity check', async () => {
		const zone = document.createElement('div');
		document.body.appendChild(zone);
		const { api, dispose } = await mountUtil(() =>
			useDropZone(() => zone, { checkValidity: () => false })
		);
		try {
			zone.dispatchEvent(dragEvent('drop', { files: [png()], items: [{ type: 'image/png' }] }));
			expect(api.files).toBeNull();
		} finally {
			zone.remove();
			await dispose();
		}
	});
});
