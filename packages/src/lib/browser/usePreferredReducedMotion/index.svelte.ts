/**
 * Reactive reduced-motion preference.
 *
 * Inspired by [VueUse `usePreferredReducedMotion`](https://vueuse.org/core/usePreferredReducedMotion/).
 * Must be called in component initialization. Server output is
 * `'no-preference'`.
 */
import { useMediaQuery } from '../useMediaQuery/index.svelte.ts';

/** Reduced-motion preference. */
export type ReducedMotionType = 'reduce' | 'no-preference';

/** Motion state returned by {@link usePreferredReducedMotion}. */
export interface UsePreferredReducedMotionReturn {
	/** Effective preference. Getter-backed (destructure-safe). */
	readonly value: ReducedMotionType;
}

/**
 * Track whether the OS requests reduced motion.
 */
export function usePreferredReducedMotion(): UsePreferredReducedMotionReturn {
	const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');

	const motion = $derived.by((): ReducedMotionType => {
		if (isReduced.value) return 'reduce';
		return 'no-preference';
	});

	return {
		get value() {
			return motion;
		}
	};
}
