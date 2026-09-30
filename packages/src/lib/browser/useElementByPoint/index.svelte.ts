import type { MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser } from '../../shared/is.ts';
import { useRafFn } from '../../utilities/useRafFn/index.ts';

/** Per-frame scheduler controls (subset of {@link UseRafFnReturn}). */
export interface UseElementByPointScheduler {
	/** Whether the loop is currently running. */
	readonly isActive: boolean;
	/** Start (or restart) the loop. */
	resume(): void;
	/** Stop the loop. */
	pause(): void;
}

/** Options for {@link useElementByPoint}. */
export interface UseElementByPointOptions<M extends boolean = false> {
	/**
	 * Drives re-queries. Defaults to a `requestAnimationFrame` loop.
	 * @default useRafFn
	 */
	scheduler?: (fn: () => void) => UseElementByPointScheduler;
	/**
	 * Return the full hit stack (`elementsFromPoint`) instead of the
	 * topmost element. Resolved once at creation.
	 * @default false
	 */
	multiple?: MaybeGetter<M>;
	/** Viewport X to query. */
	x: MaybeGetter<number>;
	/** Viewport Y to query. */
	y: MaybeGetter<number>;
}

/** State returned by {@link useElementByPoint}. */
export interface UseElementByPointReturn<M extends boolean = false> {
	/** Hit element(s) at the point. Getter-backed. */
	readonly element: M extends true ? HTMLElement[] : HTMLElement | null;
	/** Whether the hit-testing API exists here. */
	readonly isSupported: boolean;
	/** Whether the query loop is running. Getter-backed. */
	readonly isActive: boolean;
	/** Resume querying. */
	resume(): void;
	/** Suspend querying. */
	pause(): void;
}

/**
 * Reactive element lookup by viewport point.
 *
 * @param options Point coordinates, multi-hit flag, and scheduler.
 * @example
 * ```ts
 * const hit = useElementByPoint({ x: () => pointer.x, y: () => pointer.y });
 * hit.element; // topmost element under the pointer
 * ```
 */
export function useElementByPoint<M extends boolean = false>(
	options: UseElementByPointOptions<M>
): UseElementByPointReturn<M> {
	const { x, y, multiple, scheduler = (fn) => useRafFn(() => fn()) } = options;

	function getDocument(): Document | undefined {
		return isBrowser && typeof document !== 'undefined' ? document : undefined;
	}

	const isMultiple = resolveGetter(multiple ?? (false as M));
	const doc = getDocument();
	const isSupported =
		doc !== undefined && (isMultiple ? 'elementsFromPoint' in doc : 'elementFromPoint' in doc);

	let element = $state<Element | Element[] | null>(null);

	function update() {
		const current = getDocument();
		if (!current || !isSupported) return;
		const px = resolveGetter(x);
		const py = resolveGetter(y);
		const next = isMultiple ? current.elementsFromPoint(px, py) : current.elementFromPoint(px, py);
		element = Array.isArray(next) ? [...next] : next;
	}

	const controls = scheduler(() => update());

	return {
		isSupported,
		get element() {
			return element as M extends true ? HTMLElement[] : HTMLElement | null;
		},
		get isActive() {
			return controls.isActive;
		},
		pause: controls.pause,
		resume: controls.resume
	};
}
