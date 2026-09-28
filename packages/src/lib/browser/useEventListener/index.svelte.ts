/**
 * SSR-safe DOM event listener with automatic disposal.
 *
 * Inspired by VueUse `useEventListener`.
 * Attaches inside `$effect` and removes the listener on cleanup, so
 * unmounting never leaks. Targets accept a `MaybeGetter` so `() => window`
 * or `() => element` re-resolve if the effect re-runs.
 * Must be called in component initialization (uses `$effect`).
 */

import type { MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';

// Overload 1: Window
/**
 * Listen for a `Window` event. No-op during SSR or when the target is nullish.
 */
export function useEventListener<K extends keyof WindowEventMap>(
	target: MaybeGetter<Window | null | undefined>,
	event: K,
	handler: (e: WindowEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Overload 2: Document
/**
 * Listen for a `Document` event. No-op during SSR or when the target is nullish.
 */
export function useEventListener<K extends keyof DocumentEventMap>(
	target: MaybeGetter<Document | null | undefined>,
	event: K,
	handler: (e: DocumentEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Overload 3: HTMLElement
/**
 * Listen for an `HTMLElement` event. No-op during SSR or when the target is nullish.
 */
export function useEventListener<K extends keyof HTMLElementEventMap>(
	target: MaybeGetter<HTMLElement | null | undefined>,
	event: K,
	handler: (e: HTMLElementEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Overload 4: MediaQueryList
/**
 * Listen for a `MediaQueryList` event (e.g. `change`). No-op during SSR or when the target is nullish.
 */
export function useEventListener<K extends keyof MediaQueryListEventMap>(
	target: MaybeGetter<MediaQueryList | null | undefined>,
	event: K,
	handler: (e: MediaQueryListEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Implementation signature
export function useEventListener(
	target: MaybeGetter<EventTarget | null | undefined>,
	event: string,
	handler: (e: Event) => void,
	options?: boolean | AddEventListenerOptions
): void {
	$effect(() => {
		if (!isBrowser) return;

		const el = resolveGetter(target);
		if (!el) return;

		el.addEventListener(event, handler, options);
		return () => {
			el.removeEventListener(event, handler, options);
		};
	});
}
