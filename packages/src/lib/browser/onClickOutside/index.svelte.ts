import type { MaybeElement, MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser, isIOS } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Options for {@link onClickOutside}. */
export interface OnClickOutsideOptions<Controls extends boolean = false> {
	/**
	 * Elements that must not trigger the handler, as element/getter
	 * entries or CSS selectors.
	 */
	ignore?: MaybeGetter<Array<MaybeElement | string>>;
	/**
	 * Fire the handler when focus moves into an iframe.
	 * @default false
	 */
	detectIframe?: boolean;
	/**
	 * Return `{ stop, cancel, trigger }` controls instead of a stop fn.
	 * @default false
	 */
	controls?: Controls;
	/**
	 * Use the capture phase for the internal click listener.
	 * @default true
	 */
	capture?: boolean;
}

/** Handler for {@link onClickOutside}. */
export type OnClickOutsideHandler<
	T extends OnClickOutsideOptions<boolean> = OnClickOutsideOptions
> = (
	event:
		| (T['detectIframe'] extends true ? FocusEvent : never)
		| (T['controls'] extends true ? Event : never)
		| PointerEvent
) => void;

/** Return of {@link onClickOutside}. */
export type OnClickOutsideReturn<Controls extends boolean = false> = Controls extends false
	? () => void
	: {
			trigger: (event: Event) => void;
			cancel: () => void;
			stop: () => void;
		};

let iOSWorkaroundInstalled = false;

/**
 * Listen for clicks outside of an element.
 *
 * @param target Element (or getter) defining the inside.
 * @param handler Called with clicks landing outside.
 * @param options Ignore list, capture phase, iframe detection, controls.
 * @example
 * ```ts
 * const stop = onClickOutside(() => menu, () => close());
 * ```
 */
export function onClickOutside<T extends OnClickOutsideOptions>(
	target: MaybeElement,
	handler: OnClickOutsideHandler<T>,
	options?: T
): () => void;

/**
 * Listen for clicks outside of an element, with manual controls.
 *
 * @param target Element (or getter) defining the inside.
 * @param handler Called with clicks landing outside.
 * @param options Ignore list, capture phase, iframe detection, controls.
 * @example
 * ```ts
 * const { stop, cancel, trigger } = onClickOutside(() => menu, () => close(), {
 * 	controls: true
 * });
 * ```
 */
export function onClickOutside<T extends OnClickOutsideOptions<true>>(
	target: MaybeElement,
	handler: OnClickOutsideHandler<T>,
	options: T
): {
	trigger: (event: Event) => void;
	cancel: () => void;
	stop: () => void;
};

// Implementation
export function onClickOutside(
	target: MaybeElement,
	handler: (event: PointerEvent | FocusEvent | Event) => void,
	options: OnClickOutsideOptions<boolean> = {}
): OnClickOutsideReturn<boolean> {
	const { ignore = [], capture = true, detectIframe = false, controls = false } = options;

	const noop = () => {};
	if (!isBrowser) {
		return controls ? { stop: noop, cancel: noop, trigger: noop } : noop;
	}

	// iOS Safari does not fire click events on non-clickable elements
	// unless something listens on them: attach permanent no-op listeners
	// once (never disposed, mirroring upstream).
	if (isIOS && !iOSWorkaroundInstalled) {
		iOSWorkaroundInstalled = true;
		const listenerOptions = { passive: true };
		for (const element of Array.from(document.body.children)) {
			element.addEventListener('click', noop, listenerOptions);
		}
		document.documentElement.addEventListener('click', noop, listenerOptions);
	}

	let shouldListen = true;
	let stopped = false;

	function composedPathOf(event: Event): EventTarget[] {
		return typeof event.composedPath === 'function' ? event.composedPath() : [];
	}

	function shouldIgnore(event: Event): boolean {
		return resolveGetter(ignore).some((entry) => {
			if (typeof entry === 'string') {
				return Array.from(document.querySelectorAll(entry)).some(
					(element) => element === event.target || composedPathOf(event).includes(element)
				);
			}
			const element = resolveGetter(entry);
			return !!element && (event.target === element || composedPathOf(event).includes(element));
		});
	}

	function listener(event: Event) {
		const element = resolveGetter(target);
		if (event.target == null) return;
		if (!element || element === event.target || composedPathOf(event).includes(element)) return;
		if ('detail' in event && (event as UIEvent).detail === 0) {
			shouldListen = !shouldIgnore(event);
		}
		if (!shouldListen) {
			shouldListen = true;
			return;
		}
		handler(event as PointerEvent);
	}

	let isProcessingClick = false;

	useEventListener(
		() => window,
		'click',
		(event) => {
			if (stopped || isProcessingClick) return;
			isProcessingClick = true;
			setTimeout(() => {
				isProcessingClick = false;
			}, 0);
			listener(event);
		},
		{ passive: true, capture }
	);
	useEventListener(
		() => window,
		'pointerdown',
		(event) => {
			if (stopped) return;
			const pointer = event as PointerEvent;
			const element = resolveGetter(target);
			shouldListen =
				!shouldIgnore(pointer) && !!element && !composedPathOf(pointer).includes(element);
		},
		{ passive: true }
	);
	if (detectIframe) {
		useEventListener(
			() => window,
			'blur',
			(event) => {
				if (stopped) return;
				const focusEvent = event as FocusEvent;
				setTimeout(() => {
					const element = resolveGetter(target);
					let active: Element | null | undefined = document.activeElement;
					while (active?.shadowRoot) active = active.shadowRoot.activeElement;
					if (active?.tagName === 'IFRAME' && !element?.contains(document.activeElement)) {
						handler(focusEvent);
					}
				}, 0);
			},
			{ passive: true }
		);
	}

	const stop = () => {
		stopped = true;
	};

	if (controls) {
		return {
			stop,
			cancel: () => {
				shouldListen = false;
			},
			trigger: (event: Event) => {
				shouldListen = true;
				listener(event);
				shouldListen = false;
			}
		};
	}

	return stop;
}
