// useEventListener/index.svelte.ts
import { isBrowser } from '../../shared/is.ts';

type MaybeGetter<T> = T | (() => T);

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

// Overload 1: Window
export function useEventListener<K extends keyof WindowEventMap>(
	target: MaybeGetter<Window | null | undefined>,
	event: K,
	handler: (e: WindowEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Overload 2: Document
export function useEventListener<K extends keyof DocumentEventMap>(
	target: MaybeGetter<Document | null | undefined>,
	event: K,
	handler: (e: DocumentEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Overload 3: HTMLElement
export function useEventListener<K extends keyof HTMLElementEventMap>(
	target: MaybeGetter<HTMLElement | null | undefined>,
	event: K,
	handler: (e: HTMLElementEventMap[K]) => void,
	options?: boolean | AddEventListenerOptions
): void;

// Overload 4: MediaQueryList
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

		const el = resolve(target);
		if (!el) return;

		el.addEventListener(event, handler, options);
		return () => {
			el.removeEventListener(event, handler, options);
		};
	});
}
