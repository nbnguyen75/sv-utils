import type { MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';

/** Options for {@link useBase64}. */
export interface UseBase64Options {
	/**
	 * Output as a Data URL (`data:…;base64,…`). When `false`, only the
	 * raw base64 payload is kept.
	 * @default true
	 */
	dataUrl?: boolean;
}

/** Extra options for canvas/image sources. */
export interface ToDataURLOptions extends UseBase64Options {
	/** Quality for lossy encodings (0–1). */
	quality?: number;
	/** MIME type for the output. */
	type?: string;
}

/** Extra options for object sources. */
export interface UseBase64ObjectOptions<T> extends UseBase64Options {
	/** Custom serializer (defaults to JSON with Map/Set support). */
	serializer?: (value: T) => string;
}

/** State returned by {@link useBase64}. */
export interface UseBase64Return {
	/** In-flight (or last) conversion promise. Getter-backed. */
	readonly promise: Promise<string> | undefined;
	/** Convert the current target now. */
	execute(): Promise<string> | undefined;
	/** Latest base64 output. Getter-backed. */
	readonly base64: string;
}

/** Default object serializer: JSON with Map/Set/Array support. */
function getDefaultSerialization(target: object): (value: object) => string {
	if (target instanceof Map)
		return (value) => JSON.stringify(Object.fromEntries(value as Map<string, unknown>));
	if (target instanceof Set) return (value) => JSON.stringify(Array.from(value as Set<unknown>));
	if (Array.isArray(target)) return (value) => JSON.stringify(value);
	return (value) => JSON.stringify(value);
}

function blobToBase64(blob: Blob): Promise<string> {
	return new Promise<string>((resolvePromise, rejectPromise) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			resolvePromise(event.target?.result as string);
		};
		reader.onerror = rejectPromise;
		reader.readAsDataURL(blob);
	});
}

function imageLoaded(image: HTMLImageElement): Promise<void> {
	return new Promise<void>((resolvePromise, rejectPromise) => {
		if (image.complete) {
			resolvePromise();
			return;
		}
		image.onload = () => resolvePromise();
		image.onerror = rejectPromise;
	});
}

/**
 * Convert strings, blobs, and buffers to base64.
 *
 * @param target Value (or getter) to convert; re-converts when it changes.
 * @param options Data-URL shape.
 * @example
 * ```ts
 * const { base64 } = useBase64('hello');
 * base64; // data:text/plain;base64,aGVsbG8=
 * ```
 */
export function useBase64(
	target: MaybeGetter<string | Blob | ArrayBuffer | null | undefined>,
	options?: UseBase64Options
): UseBase64Return;
/**
 * Convert canvases and images to base64.
 *
 * @param target Value (or getter) to convert; re-converts when it changes.
 * @param options Data-URL shape, MIME type, quality.
 * @example
 * ```ts
 * const { base64 } = useBase64(() => canvas, { type: 'image/png' });
 * ```
 */
export function useBase64(
	target: MaybeGetter<HTMLCanvasElement | HTMLImageElement | null | undefined>,
	options?: ToDataURLOptions
): UseBase64Return;
/**
 * Convert objects (JSON with Map/Set support, or a custom serializer).
 *
 * @param target Value (or getter) to convert; re-converts when it changes.
 * @param options Data-URL shape and serializer.
 * @example
 * ```ts
 * const { base64 } = useBase64(() => state);
 * ```
 */
export function useBase64<T extends object>(
	target: MaybeGetter<T | null | undefined>,
	options?: UseBase64ObjectOptions<T>
): UseBase64Return;

// Implementation
export function useBase64(
	target: MaybeGetter<unknown>,
	options?: UseBase64Options | ToDataURLOptions | UseBase64ObjectOptions<unknown>
): UseBase64Return {
	const { dataUrl = true } = options ?? {};

	let base64 = $state('');
	let promise = $state<Promise<string> | undefined>(undefined);

	function convert(value: unknown): Promise<string> {
		if (value == null) return Promise.resolve('');
		if (typeof value === 'string') return blobToBase64(new Blob([value], { type: 'text/plain' }));
		if (value instanceof Blob) return blobToBase64(value);
		if (value instanceof ArrayBuffer) {
			return Promise.resolve(window.btoa(String.fromCharCode(...new Uint8Array(value))));
		}
		if (value instanceof HTMLCanvasElement || value instanceof HTMLImageElement) {
			return convertVisual(value);
		}
		if (typeof value === 'object') {
			const objectOptions = options as UseBase64ObjectOptions<object> | undefined;
			const serialize = objectOptions?.serializer ?? getDefaultSerialization(value);
			return blobToBase64(new Blob([serialize(value)], { type: 'application/json' }));
		}
		return Promise.reject(new Error('target is unsupported types'));
	}

	function convertVisual(value: HTMLCanvasElement | HTMLImageElement): Promise<string> {
		const visualOptions = options as ToDataURLOptions | undefined;
		if (value instanceof HTMLCanvasElement) {
			return Promise.resolve(value.toDataURL(visualOptions?.type, visualOptions?.quality));
		}
		const image = value.cloneNode(false) as HTMLImageElement;
		image.crossOrigin = 'Anonymous';
		return imageLoaded(image).then(() => {
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			if (!context) throw new Error('2d canvas context is unavailable');
			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			return canvas.toDataURL(visualOptions?.type, visualOptions?.quality);
		});
	}

	function execute(): Promise<string> | undefined {
		if (!isBrowser) return undefined;
		const task = convert(resolveGetter(target));
		promise = task;
		void task.then(
			(result) => {
				base64 = dataUrl ? result : result.replace(/^data:.*?;base64,/, '');
			},
			() => {}
		);
		return task;
	}

	if (isBrowser) {
		$effect(() => {
			resolveGetter(target);
			execute();
		});
	}

	return {
		get base64() {
			return base64;
		},
		get promise() {
			return promise;
		},
		execute
	};
}
