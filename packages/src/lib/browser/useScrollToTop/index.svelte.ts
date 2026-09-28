import { cubicOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';

import { isBrowser } from '../../shared/is.ts';

type MaybeGetter<T> = T | (() => T);

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

export interface UseScrollToTopOptions {
	easing?: (t: number) => number;
	duration?: number;
}

export function useScrollToTop(
	target: MaybeGetter<Window | HTMLElement | null | undefined> = () =>
		isBrowser ? window : undefined,
	options: UseScrollToTopOptions = {}
) {
	const { duration = 400, easing = cubicOut } = options;

	function getScrollTop(el: Window | HTMLElement): number {
		return el instanceof Window ? el.scrollY : el.scrollTop;
	}

	function setScrollTop(el: Window | HTMLElement, top: number) {
		if (el instanceof Window) el.scrollTo(0, top);
		else el.scrollTop = top;
	}

	async function scrollToTop() {
		if (!isBrowser) return;
		const el = resolve(target);
		if (!el) return;

		const progress = new Tween(getScrollTop(el), { duration, easing });

		const stop = $effect.root(() => {
			$effect(() => {
				setScrollTop(el, progress.current);
			});
		});

		await progress.set(0);
		stop();
	}

	return { scrollToTop };
}
