/**
 * Reactive frames-per-second meter over `requestAnimationFrame`.
 *
 * Inspired by [VueUse `useFps`](https://vueuse.org/core/useFps/).
 * Returns `0` where `performance` is unavailable (including SSR) without
 * starting any loop. Otherwise samples via `useRafFn`, so this must be
 * called in component initialization.
 */

import { useRafFn } from '../useRafFn/index.svelte.ts';

/** Options for {@link useFps}. */
export interface UseFpsOptions {
	/**
	 * Recompute the average every this many frames.
	 * @default 10
	 */
	every?: number;
}

/** State returned by {@link useFps}. */
export interface UseFpsReturn {
	/** Latest measured FPS (`0` before the first sample). Getter-backed. */
	readonly value: number;
}

/**
 * Measure rendering FPS.
 *
 * @param options `every`: frames per sample window.
 */
export function useFps(options: UseFpsOptions = {}): UseFpsReturn {
	const { every = 10 } = options;

	let fps = $state(0);
	if (typeof performance === 'undefined') {
		return {
			get value() {
				return fps;
			}
		};
	}

	let last = performance.now();
	let ticks = 0;

	useRafFn(() => {
		ticks += 1;
		if (ticks >= every) {
			const now = performance.now();
			const diff = now - last;
			fps = Math.round(1000 / (diff / ticks));
			last = now;
			ticks = 0;
		}
	});

	return {
		get value() {
			return fps;
		}
	};
}
