import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';

/** Dimension source. */
export type UseWindowSizeType = 'inner' | 'outer' | 'visual';

/** Options for {@link useWindowSize}. */
export interface UseWindowSizeOptions {
	/**
	 * Refresh on orientation changes (via media query).
	 * @default true
	 */
	listenOrientation?: boolean;
	/**
	 * Use `innerWidth`/`innerHeight` (with scrollbar) instead of the
	 * document client size. Only applies to `type: 'inner'`.
	 * @default true
	 */
	includeScrollbar?: boolean;
	/**
	 * Dimension source: viewport, window chrome, or visual viewport
	 * (falls back to inner when `visualViewport` is unavailable).
	 * @default 'inner'
	 */
	type?: UseWindowSizeType;
	/**
	 * Server and pre-mount height.
	 * @default Infinity
	 */
	initialHeight?: number;
	/**
	 * Server and pre-mount width.
	 * @default Infinity
	 */
	initialWidth?: number;
}

/** Size state returned by {@link useWindowSize}. */
export interface UseWindowSizeReturn {
	/** Viewport/window height. Getter-backed (destructure-safe). */
	readonly height: number;
	/** Viewport/window width. Getter-backed (destructure-safe). */
	readonly width: number;
}

/**
 * Track window dimensions.
 *
 * @param options Initials, orientation listening, scrollbar, and source.
 * @example
 * ```ts
 * const { width, height } = useWindowSize();
 * width < 768; // responsive branch
 * ```
 */
export function useWindowSize(options: UseWindowSizeOptions = {}): UseWindowSizeReturn {
	const {
		initialWidth = Number.POSITIVE_INFINITY,
		initialHeight = Number.POSITIVE_INFINITY,
		listenOrientation = true,
		includeScrollbar = true,
		type = 'inner'
	} = options;

	let width = $state(initialWidth);
	let height = $state(initialHeight);

	function update() {
		if (!isBrowser) return;
		if (type === 'outer') {
			width = window.outerWidth;
			height = window.outerHeight;
		} else if (type === 'visual' && window.visualViewport) {
			const viewport = window.visualViewport;
			width = Math.round(viewport.width * viewport.scale);
			height = Math.round(viewport.height * viewport.scale);
		} else if (includeScrollbar) {
			width = window.innerWidth;
			height = window.innerHeight;
		} else {
			width = window.document.documentElement.clientWidth;
			height = window.document.documentElement.clientHeight;
		}
	}

	if (isBrowser) {
		$effect(() => {
			update();
		});

		useEventListener(() => window, 'resize', update, { passive: true });

		if (type === 'visual' && window.visualViewport) {
			useEventListener(() => window.visualViewport, 'resize', update, { passive: true });
		}

		if (listenOrientation) {
			const portrait = useMediaQuery('(orientation: portrait)');
			let lastOrientation: boolean | undefined;
			$effect(() => {
				const isPortrait = portrait.value;
				untrack(() => {
					if (isPortrait !== lastOrientation) {
						lastOrientation = isPortrait;
						update();
					}
				});
			});
		}
	}

	return {
		get width() {
			return width;
		},
		get height() {
			return height;
		}
	};
}
