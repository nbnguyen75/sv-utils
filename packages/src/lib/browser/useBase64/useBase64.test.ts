// @vitest-environment jsdom
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import { mountUtil } from '../../../../test/fixtures/mount.ts';
import { useCounter } from '../../state/useCounter/index.ts';
import { useBase64 } from './index.ts';

describe('useBase64', () => {
	it('converts a string to a data URL', async () => {
		const { api, dispose } = await mountUtil(() => useBase64('hello'));
		try {
			await api.promise;
			expect(api.base64).toBe('data:text/plain;base64,aGVsbG8=');
		} finally {
			await dispose();
		}
	});

	it('strips the prefix with dataUrl false', async () => {
		const { api, dispose } = await mountUtil(() => useBase64('hello', { dataUrl: false }));
		try {
			await api.promise;
			expect(api.base64).toBe('aGVsbG8=');
		} finally {
			await dispose();
		}
	});

	it('converts blobs and buffers', async () => {
		const { api: blobApi, dispose: disposeBlob } = await mountUtil(() =>
			useBase64(new Blob(['abc']))
		);
		try {
			await blobApi.promise;
			expect(blobApi.base64).toMatch(/^data:.*;base64,/);
		} finally {
			await disposeBlob();
		}
		const { api: bufferApi, dispose: disposeBuffer } = await mountUtil(() =>
			useBase64(new Uint8Array([104, 105]).buffer as ArrayBuffer)
		);
		try {
			await bufferApi.promise;
			expect(bufferApi.base64).toBe('aGk=');
		} finally {
			await disposeBuffer();
		}
	});

	it('serializes objects with Map and Set support', async () => {
		// Only top-level Map/Set/Array get structural serializers (matching
		// upstream); nested ones fall through to plain JSON.
		const { api, dispose } = await mountUtil(() => useBase64({ list: [1], name: 'x' }));
		try {
			const raw = await api.promise;
			const payload = (raw as string).replace(/^data:.*?;base64,/, '');
			expect(JSON.parse(window.atob(payload))).toEqual({ list: [1], name: 'x' });
		} finally {
			await dispose();
		}
		const { api: mapApi, dispose: disposeMap } = await mountUtil(() =>
			useBase64(new Map([['k', 'v']]))
		);
		try {
			const raw = await mapApi.promise;
			const payload = (raw as string).replace(/^data:.*?;base64,/, '');
			expect(JSON.parse(window.atob(payload))).toEqual({ k: 'v' });
		} finally {
			await disposeMap();
		}
		const { api: setApi, dispose: disposeSet } = await mountUtil(() => useBase64(new Set([1, 2])));
		try {
			const raw = await setApi.promise;
			const payload = (raw as string).replace(/^data:.*?;base64,/, '');
			expect(JSON.parse(window.atob(payload))).toEqual([1, 2]);
		} finally {
			await disposeSet();
		}
	});

	it('honors a custom serializer', async () => {
		const { api, dispose } = await mountUtil(() =>
			useBase64({ a: 1 }, { serializer: () => 'custom' })
		);
		try {
			await api.promise;
			expect(api.base64).toBe('data:application/json;base64,Y3VzdG9t');
		} finally {
			await dispose();
		}
	});

	it('re-converts when the target changes', async () => {
		// Drive the getter through real reactive state so the watcher
		// re-runs (a plain reassigned variable would not notify).
		const { api, dispose } = await mountUtil(() => {
			const counter = useCounter(0);
			const encoded = useBase64(() => `n${counter.count}`, { dataUrl: false });
			return { counter, encoded };
		});
		try {
			await api.encoded.promise;
			expect(api.encoded.base64).toBe('bjA=');
			api.counter.inc();
			await tick();
			await api.encoded.promise;
			expect(api.encoded.base64).toBe('bjE=');
		} finally {
			await dispose();
		}
	});

	it('resolves empty for nullish targets', async () => {
		const { api, dispose } = await mountUtil(() => useBase64(null));
		try {
			await expect(api.execute()).resolves.toBe('');
			expect(api.base64).toBe('');
		} finally {
			await dispose();
		}
	});

	it('rejects unsupported targets', async () => {
		const { api, dispose } = await mountUtil(() => useBase64(42 as unknown as string));
		try {
			await expect(api.execute()).rejects.toThrow('unsupported');
		} finally {
			await dispose();
		}
	});
});
