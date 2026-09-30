import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Key match: accept all, one key, several keys, or a predicate. */
export type KeyFilter = true | string | string[] | KeyPredicate;

/** Key predicate. */
export type KeyPredicate = (event: KeyboardEvent) => boolean;

/** Keyboard event to listen for. */
export type KeyStrokeEventName = 'keydown' | 'keypress' | 'keyup';

/** Options for {@link onKeyStroke} (and the key-specific shorthands). */
export interface OnKeyStrokeOptions {
	/**
	 * Event to listen for.
	 * @default 'keydown'
	 */
	eventName?: KeyStrokeEventName;
	/**
	 * Element (or getter) receiving keyboard events.
	 * @default window
	 */
	target?: MaybeGetter<EventTarget | null | undefined>;
	/**
	 * Register the listener as passive.
	 * @default false
	 */
	passive?: boolean;
	/**
	 * Ignore auto-repeated events while the key is held down.
	 * Resolved per event, so it can be reactive.
	 * @default false
	 */
	dedupe?: MaybeGetter<boolean>;
}

function createKeyPredicate(keyFilter: KeyFilter): KeyPredicate {
	if (typeof keyFilter === 'function') return keyFilter;
	if (typeof keyFilter === 'string') return (event: KeyboardEvent) => event.key === keyFilter;
	if (Array.isArray(keyFilter)) return (event: KeyboardEvent) => keyFilter.includes(event.key);
	return () => true;
}

/**
 * Listen for keyboard keystrokes matching a filter.
 *
 * @param key Accepted key(s), a predicate, or `true` for all keys.
 * @param handler Called with matching events.
 * @param options Event name, target, passive mode, repeat dedupe.
 * @example
 * ```ts
 * const stop = onKeyStroke('Escape', () => close());
 * ```
 */
export function onKeyStroke(
	key: KeyFilter,
	handler: (event: KeyboardEvent) => void,
	options?: OnKeyStrokeOptions
): () => void;
/**
 * Listen for all keyboard keystrokes.
 *
 * @param handler Called with every event.
 * @param options Event name, target, passive mode, repeat dedupe.
 * @example
 * ```ts
 * const stop = onKeyStroke((event) => log(event.key));
 * ```
 */
export function onKeyStroke(
	handler: (event: KeyboardEvent) => void,
	options?: OnKeyStrokeOptions
): () => void;

// Implementation
export function onKeyStroke(
	keyOrHandler: KeyFilter | ((event: KeyboardEvent) => void),
	handlerOrOptions?: ((event: KeyboardEvent) => void) | OnKeyStrokeOptions,
	maybeOptions?: OnKeyStrokeOptions
): () => void {
	let key: KeyFilter = true;
	let handler: (event: KeyboardEvent) => void;
	let options: OnKeyStrokeOptions = {};

	if (typeof keyOrHandler === 'function') {
		handler = keyOrHandler;
		if (handlerOrOptions && typeof handlerOrOptions === 'object') options = handlerOrOptions;
	} else {
		key = keyOrHandler;
		handler = handlerOrOptions as (event: KeyboardEvent) => void;
		if (maybeOptions) options = maybeOptions;
	}

	const { target, eventName = 'keydown', passive = false, dedupe = false } = options;
	const predicate = createKeyPredicate(key);
	let stopped = false;

	function listener(event: Event) {
		if (stopped) return;
		const keyboardEvent = event as KeyboardEvent;
		if (keyboardEvent.repeat && resolveGetter(dedupe)) return;
		if (predicate(keyboardEvent)) handler(keyboardEvent);
	}

	if (isBrowser) {
		useEventListener(target ?? (() => window), eventName, listener, passive);
	}

	return () => {
		stopped = true;
	};
}

/**
 * Listen to the `keydown` event of the given key.
 *
 * @param key Accepted key(s), a predicate, or `true` for all keys.
 * @param handler Called with matching events.
 * @param options Target, passive mode, repeat dedupe.
 * @example
 * ```ts
 * const stop = onKeyDown('Enter', () => submit());
 * ```
 */
export function onKeyDown(
	key: KeyFilter,
	handler: (event: KeyboardEvent) => void,
	options: Omit<OnKeyStrokeOptions, 'eventName'> = {}
): () => void {
	return onKeyStroke(key, handler, { ...options, eventName: 'keydown' });
}

/**
 * Listen to the `keypress` event of the given key.
 *
 * @param key Accepted key(s), a predicate, or `true` for all keys.
 * @param handler Called with matching events.
 * @param options Target, passive mode, repeat dedupe.
 * @example
 * ```ts
 * const stop = onKeyPressed('Enter', () => submit());
 * ```
 */
export function onKeyPressed(
	key: KeyFilter,
	handler: (event: KeyboardEvent) => void,
	options: Omit<OnKeyStrokeOptions, 'eventName'> = {}
): () => void {
	return onKeyStroke(key, handler, { ...options, eventName: 'keypress' });
}

/**
 * Listen to the `keyup` event of the given key.
 *
 * @param key Accepted key(s), a predicate, or `true` for all keys.
 * @param handler Called with matching events.
 * @param options Target, passive mode, repeat dedupe.
 * @example
 * ```ts
 * const stop = onKeyUp('Escape', () => close());
 * ```
 */
export function onKeyUp(
	key: KeyFilter,
	handler: (event: KeyboardEvent) => void,
	options: Omit<OnKeyStrokeOptions, 'eventName'> = {}
): () => void {
	return onKeyStroke(key, handler, { ...options, eventName: 'keyup' });
}
