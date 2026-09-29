import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { isIOS } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import type { ScrollTarget } from '../useScroll/index.svelte.ts';

/** Lock state returned by {@link useScrollLock}. */
export interface UseScrollLockReturn {
	/** Whether scrolling is locked. Assign to lock/unlock. Getter/setter-backed. */
	value: boolean;
}

const initialOverflows = new WeakMap<HTMLElement, string>();

function resolveLockTarget(target: ScrollTarget): HTMLElement | undefined {
	if (!target) return undefined;
	if (typeof target === 'object' && 'documentElement' in target && target.documentElement) {
		return target.documentElement as unknown as HTMLElement;
	}
	return target as HTMLElement;
}

function hasScrollableAncestor(element: Element): boolean {
	if (!isBrowser) return false;
	const style = window.getComputedStyle(element);
	if (
		style.overflowX === 'scroll' ||
		style.overflowY === 'scroll' ||
		(style.overflowX === 'auto' && element.clientWidth < element.scrollWidth) ||
		(style.overflowY === 'auto' && element.clientHeight < element.scrollHeight)
	) {
		return true;
	}
	const parent = element.parentNode as Element | null;
	if (!parent || parent.tagName === 'BODY') return false;
	return hasScrollableAncestor(parent);
}

/**
 * Lock scrolling of an element (default: document element).
 *
 * @param target Element, window, document, or getter; omitted locks the page.
 * @param initialState Whether to lock on mount.
 * @example
 * ```ts
 * const lock = useScrollLock(() => dialog);
 * lock.value = true; // overflow hidden (restored on unlock)
 * ```
 */
export function useScrollLock(
	target?: MaybeGetter<ScrollTarget>,
	initialState = false
): UseScrollLockReturn {
	let locked = $state(initialState);
	let initialOverflow = '';
	// Disposal mirror: teardown cleanups cannot reliably read `$state`
	// (reads observe pre-teardown values), so unmount restore uses only
	// plain variables captured at lock time.
	let armed: { element: HTMLElement; overflow: string } | undefined;

	function currentElement(): HTMLElement | undefined {
		if (!isBrowser) return undefined;
		const raw = target === undefined ? document.documentElement : resolveGetter(target);
		const mapped = resolveLockTarget(raw ?? undefined);
		if (!mapped || !('style' in mapped)) return undefined;
		return mapped as HTMLElement;
	}

	function lock() {
		const element = currentElement();
		if (!element || locked) return;
		armed = { element, overflow: element.style.overflow };
		element.style.overflow = 'hidden';
		locked = true;
	}

	function unlock() {
		const element = currentElement();
		if (!element || !locked) return;
		element.style.overflow = initialOverflow;
		initialOverflows.delete(element);
		locked = false;
		armed = undefined;
	}

	if (isBrowser) {
		$effect(() => {
			// Mirror upstream's immediate watch: adopt pre-hidden targets,
			// remember the previous overflow, and re-apply on target swaps.
			const element = currentElement();
			untrack(() => {
				if (!element) return;
				if (!initialOverflows.get(element)) initialOverflows.set(element, element.style.overflow);
				if (element.style.overflow !== 'hidden') initialOverflow = element.style.overflow;
				if (element.style.overflow === 'hidden') {
					locked = true;
					armed = { element, overflow: initialOverflow };
				} else if (locked) {
					armed = { element, overflow: element.style.overflow };
					element.style.overflow = 'hidden';
				}
			});
			return () => {
				const snapshot = armed;
				armed = undefined;
				if (snapshot) {
					snapshot.element.style.overflow = snapshot.overflow;
					initialOverflows.delete(snapshot.element);
				}
			};
		});

		if (isIOS) {
			useEventListener(
				() => currentElement(),
				'touchmove',
				(event) => {
					if (!locked) return;
					const touch = event as TouchEvent;
					const targetElement = touch.target as Element | null;
					if (targetElement && hasScrollableAncestor(targetElement)) return;
					if (touch.touches.length > 1) return;
					if (touch.preventDefault) touch.preventDefault();
				},
				{ passive: false }
			);
		}
	}

	return {
		get value() {
			return locked;
		},
		set value(next: boolean) {
			if (next) lock();
			else unlock();
		}
	};
}
