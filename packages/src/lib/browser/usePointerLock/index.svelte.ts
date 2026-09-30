import type { MaybeElement } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Options for {@link usePointerLock}. Reserved for future parity. */
export type UsePointerLockOptions = Record<string, never>;

/** State returned by {@link usePointerLock}. */
export interface UsePointerLockReturn {
	/**
	 * Lock the given target (or the click event's element, or the creation
	 * target when omitted); resolves when locked.
	 */
	lock(target?: MaybeElement | Event): Promise<Element | null | undefined>;
	/** Element whose click started the lock. Getter-backed. */
	readonly triggerElement: Element | null | undefined;
	/** Currently locked element (`null` when unlocked). Getter-backed. */
	readonly element: Element | null | undefined;
	/** Whether the Pointer Lock API exists here. */
	readonly isSupported: boolean;
	/** Exit the lock; resolves `false` when nothing was locked. */
	unlock(): Promise<boolean>;
}

/**
 * Reactive pointer lock.
 *
 * @param target Default lock target (element or getter).
 * @param options Reserved for future parity.
 * @example
 * ```ts
 * const { lock, unlock, element } = usePointerLock(() => canvas);
 * await lock(); // pointer captured
 * element; // canvas
 * await unlock();
 * ```
 */
export function usePointerLock(
	target?: MaybeElement,
	options: UsePointerLockOptions = {}
): UsePointerLockReturn {
	void options;

	const isSupported =
		isBrowser && typeof document !== 'undefined' && 'pointerLockElement' in document;

	let element = $state<Element | null | undefined>(undefined);
	let triggerElement = $state<Element | null | undefined>(undefined);
	let targetElement: Element | null | undefined;

	function getDocument(): Document | undefined {
		return isBrowser && typeof document !== 'undefined' ? document : undefined;
	}

	if (isSupported) {
		const listenerOptions = { passive: true } as const;
		useEventListener(
			() => getDocument(),
			'pointerlockchange',
			() => {
				const doc = getDocument();
				if (!doc) return;
				const currentElement = doc.pointerLockElement ?? element;
				if (targetElement && currentElement === targetElement) {
					element = doc.pointerLockElement as Element | null;
					if (!element) targetElement = triggerElement = null;
				}
			},
			listenerOptions
		);
		useEventListener(
			() => getDocument(),
			'pointerlockerror',
			() => {
				const doc = getDocument();
				if (!doc) return;
				const currentElement = doc.pointerLockElement ?? element;
				if (targetElement && currentElement === targetElement) {
					const action = doc.pointerLockElement ? 'release' : 'acquire';
					throw new Error(`Failed to ${action} pointer lock.`);
				}
			},
			listenerOptions
		);
	}

	async function lock(e?: MaybeElement | Event): Promise<Element | null | undefined> {
		if (!isSupported) throw new Error('Pointer Lock API is not supported by your browser.');
		const doc = getDocument();
		if (!doc) throw new Error('Pointer Lock API is not supported by your browser.');
		if (e === undefined) {
			triggerElement = null;
			targetElement = resolveGetter(target);
		} else if (typeof Event !== 'undefined' && e instanceof Event) {
			triggerElement = (e.currentTarget as Element | null) ?? null;
			targetElement = resolveGetter(target) ?? triggerElement;
		} else {
			triggerElement = null;
			targetElement = resolveGetter(e as MaybeElement);
		}
		if (!targetElement) throw new Error('Target element undefined.');
		// NOTE: `until()` cannot be used here — it creates an `$effect`,
		// which is an orphan outside component setup. A one-shot listener
		// attached *before* the request is race-free instead.
		const wanted = targetElement;
		return await new Promise<Element | null | undefined>((resolvePromise) => {
			const onChange = () => {
				if (element === wanted) {
					doc.removeEventListener('pointerlockchange', onChange);
					resolvePromise(element);
				}
			};
			doc.addEventListener('pointerlockchange', onChange);
			void wanted.requestPointerLock();
			// Synchronous implementations dispatch before returning.
			if (element === wanted) {
				doc.removeEventListener('pointerlockchange', onChange);
				resolvePromise(element);
			}
		});
	}

	async function unlock(): Promise<boolean> {
		const doc = getDocument();
		if (!element || !doc) return false;
		return await new Promise<boolean>((resolvePromise) => {
			const onChange = () => {
				if (element === null) {
					doc.removeEventListener('pointerlockchange', onChange);
					resolvePromise(true);
				}
			};
			doc.addEventListener('pointerlockchange', onChange);
			doc.exitPointerLock();
			if (element === null) {
				doc.removeEventListener('pointerlockchange', onChange);
				resolvePromise(true);
			}
		});
	}

	return {
		isSupported,
		get element() {
			return element;
		},
		get triggerElement() {
			return triggerElement;
		},
		lock,
		unlock
	};
}
