import type { MaybeGetter } from '../../shared/getter/index.ts';

import { tick } from 'svelte';

import { useResizeObserver } from '../../elements/useResizeObserver/index.svelte.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';

/** Style property manipulated by {@link useTextareaAutosize}. */
export type TextareaAutosizeStyleProp = 'height' | 'minHeight';

/** Options for {@link useTextareaAutosize}. */
export interface UseTextareaAutosizeOptions {
	/** Textarea element to autosize. */
	element?: MaybeGetter<HTMLTextAreaElement | null | undefined>;
	/**
	 * Style target receiving the height. Defaults to the textarea itself.
	 */
	styleTarget?: MaybeGetter<HTMLElement | null | undefined>;
	/**
	 * Style property manipulated for the height.
	 * @default 'height'
	 */
	styleProp?: TextareaAutosizeStyleProp;
	/** Textarea content; resizing re-runs when it changes. */
	input?: MaybeGetter<string>;
	/** Called when the measured height changes. */
	onResize?: () => void;
	/** Maximum autosized height in pixels. */
	maxHeight?: number;
}

/** State returned by {@link useTextareaAutosize}. */
export interface UseTextareaAutosizeReturn {
	/** The textarea element. Getter-backed. */
	readonly textarea: HTMLTextAreaElement | null | undefined;
	/** The input content. Getter-backed. */
	readonly input: string;
	/** Measure and apply the height now. */
	triggerResize(): void;
}

/**
 * Auto-grow a textarea to fit its content.
 *
 * @param options Element, input, height cap, style target/property.
 * @example
 * ```ts
 * const { triggerResize } = useTextareaAutosize({
 * 	element: () => area,
 * 	input: () => draft
 * });
 * ```
 */
export function useTextareaAutosize(
	options: UseTextareaAutosizeOptions = {}
): UseTextareaAutosizeReturn {
	const { element, input, styleTarget, styleProp = 'height', maxHeight, onResize } = options;

	let lastMeasured = 0;
	let oldWidth = 0;

	function triggerResize() {
		const area = resolveGetter(element ?? null);
		if (!area) return;
		let height = '';
		area.style[styleProp] = '1px';
		const measured = area.scrollHeight;
		const styleHeight = maxHeight != null ? `${Math.min(measured, maxHeight)}px` : `${measured}px`;
		const styleElement = resolveGetter(styleTarget ?? null);
		if (styleElement) styleElement.style[styleProp] = styleHeight;
		else height = styleHeight;
		area.style[styleProp] = height;
		if (measured !== lastMeasured) {
			lastMeasured = measured;
			onResize?.();
		}
	}

	if (isBrowser) {
		$effect(() => {
			// Subscribe to both sources; measure after the DOM settles.
			const area = resolveGetter(element ?? null);
			resolveGetter(input ?? '');
			if (!area) return;
			void tick().then(() => {
				if (!area.isConnected) return;
				triggerResize();
			});
		});

		useResizeObserver(element ?? (() => null), (entries) => {
			const first = entries[0];
			if (!first) return;
			const width = first.contentRect.width;
			if (width === oldWidth) return;
			const apply = () => {
				oldWidth = width;
				triggerResize();
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply);
			else apply();
		});
	}

	return {
		get textarea() {
			return resolveGetter(element ?? null);
		},
		get input() {
			return resolveGetter(input ?? '');
		},
		triggerResize
	};
}
