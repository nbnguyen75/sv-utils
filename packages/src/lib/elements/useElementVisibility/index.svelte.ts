import { useIntersectionObserver } from '../useIntersectionObserver/index.svelte.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';

/** Options for {@link useElementVisibility}. */
export interface UseElementVisibilityOptions {
	/**
	 * Value until the first observation.
	 * @default false
	 */
	initialValue?: boolean;
	/**
	 * Stop tracking after the first visible report.
	 * @default false
	 */
	once?: boolean;
	/**
	 * Intersection threshold(s).
	 * @default 0
	 */
	threshold?: number | number[];
	/**
	 * Root margin string.
	 */
	rootMargin?: string;
	/**
	 * Scroll container used as the intersection root.
	 */
	scrollTarget?: MaybeElement;
}

/** State returned by {@link useElementVisibility}. */
export interface UseElementVisibilityReturn {
	/** Whether the element is currently visible. Getter-backed. */
	readonly value: boolean;
	/** Whether `IntersectionObserver` exists here. */
	readonly isSupported: boolean;
	/** Whether observation is active. Getter-backed. */
	readonly isActive: boolean;
	/** Suspend observation. */
	pause(): void;
	/** Resume observation. */
	resume(): void;
	/** Stop permanently. */
	stop(): void;
}

/**
 * Track whether an element is visible in the viewport.
 *
 * @param element Target element or getter.
 * @param options Initial value, thresholds, root, and once mode.
 * @example
 * ```ts
 * const visible = useElementVisibility(() => hero, { once: true });
 * visible.value; // true once seen
 * ```
 */
export function useElementVisibility(
	element: MaybeElement,
	options: UseElementVisibilityOptions = {}
): UseElementVisibilityReturn {
	const { initialValue = false, once = false, threshold = 0, rootMargin, scrollTarget } = options;

	let visible = $state(initialValue);

	const controls = useIntersectionObserver(
		element,
		(entries) => {
			let latest = 0;
			let current = visible;
			for (const entry of entries) {
				if (entry.time >= latest) {
					latest = entry.time;
					current = entry.isIntersecting;
				}
			}
			visible = current;
			if (current && once) controls.stop();
		},
		{ root: scrollTarget, rootMargin, threshold }
	);

	return {
		get value() {
			return visible;
		},
		isSupported: controls.isSupported,
		get isActive() {
			return controls.isActive;
		},
		pause: controls.pause,
		resume: controls.resume,
		stop: controls.stop
	};
}
