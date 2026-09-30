import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useAsyncState } from '../../state/useAsyncState/index.svelte.ts';
import type {
	UseAsyncStateOptions,
	UseAsyncStateReturn
} from '../../state/useAsyncState/index.svelte.ts';

/** Options for {@link useImage}. Mirrors `<img>` attributes. */
export interface UseImageOptions {
	/** Address of the resource. */
	src: string;
	/** Images for different situations (e.g. high-resolution displays). */
	srcset?: string;
	/** Image sizes for different page layouts. */
	sizes?: string;
	/** Alternative information. */
	alt?: string;
	/** Image classes. */
	class?: string;
	/** Loading hint. */
	loading?: HTMLImageElement['loading'];
	/** CORS settings. */
	crossorigin?: string;
	/** Referrer policy for the fetch. */
	referrerPolicy?: HTMLImageElement['referrerPolicy'];
	/** Image width. */
	width?: HTMLImageElement['width'];
	/** Image height. */
	height?: HTMLImageElement['height'];
	/** Decoding hint. */
	decoding?: HTMLImageElement['decoding'];
	/** Fetch priority hint. */
	fetchPriority?: HTMLImageElement['fetchPriority'];
	/** Server-side image map flag. */
	ismap?: HTMLImageElement['isMap'];
	/** Partial URL of an associated image map. */
	usemap?: HTMLImageElement['useMap'];
}

/** State returned by {@link useImage}. */
export type UseImageReturn = UseAsyncStateReturn<HTMLImageElement | undefined, []>;

function loadImage(options: UseImageOptions): Promise<HTMLImageElement> {
	return new Promise<HTMLImageElement>((resolvePromise, rejectPromise) => {
		if (typeof Image === 'undefined') {
			rejectPromise(new Error('Image is unavailable'));
			return;
		}
		const image = new Image();
		const {
			src,
			srcset,
			sizes,
			class: clazz,
			loading,
			crossorigin,
			referrerPolicy,
			width,
			height,
			decoding,
			fetchPriority,
			ismap,
			usemap
		} = options;

		image.src = src;
		if (srcset != null) image.srcset = srcset;
		if (sizes != null) image.sizes = sizes;
		if (clazz != null) image.className = clazz;
		if (loading != null) image.loading = loading;
		if (crossorigin != null) image.crossOrigin = crossorigin;
		if (referrerPolicy != null) image.referrerPolicy = referrerPolicy;
		if (width != null) image.width = width;
		if (height != null) image.height = height;
		if (decoding != null) image.decoding = decoding;
		if (fetchPriority != null) image.fetchPriority = fetchPriority;
		if (ismap != null) image.isMap = ismap;
		if (usemap != null) image.useMap = usemap;

		image.onload = () => resolvePromise(image);
		image.onerror = rejectPromise;
	});
}

/**
 * Reactively load an image: await the result or show a fallback.
 *
 * @param options Image attributes (or getter); reloads when they change.
 * @param asyncStateOptions Async controls (`delay`, `immediate`, …).
 * @example
 * ```ts
 * const image = useImage(() => ({ src: photo.url }));
 * image.isLoading; // true while fetching
 * image.state; // HTMLImageElement once ready
 * ```
 */
export function useImage(
	options: MaybeGetter<UseImageOptions>,
	asyncStateOptions: UseAsyncStateOptions<HTMLImageElement | undefined> = {}
): UseImageReturn {
	const { immediate = true, delay } = asyncStateOptions;
	const state = useAsyncState<HTMLImageElement | undefined, []>(
		() => loadImage(resolveGetter(options)),
		undefined,
		{ resetOnExecute: true, ...asyncStateOptions, immediate: false }
	);

	if (isBrowser) {
		let first = true;
		$effect(() => {
			resolveGetter(options);
			// The async state runs with immediate: false above so this
			// effect owns execution: mount (unless disabled) + changes.
			// `first` is plain (never reactive), so no aliasing concern.
			if (!first || immediate) {
				first = false;
				void state.execute(delay);
			} else {
				first = false;
			}
		});
	}

	return state;
}
