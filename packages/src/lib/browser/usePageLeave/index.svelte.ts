/**
 * Reactive page-leave detection (pointer leaving the viewport).
 *
 * Inspired by [VueUse `usePageLeave`](https://vueuse.org/core/usePageLeave/).
 * Listens to `mouseout` on window plus `mouseleave`/`mouseenter` on the
 * document; the page counts as left when the pointer moves to nothing
 * (legacy `toElement` covered without `any` casts). Must be called in
 * component initialization. Server value is `false`. Disposal on unmount
 * is automatic.
 */
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Page-leave state returned by {@link usePageLeave}. */
export interface UsePageLeaveReturn {
	/** Whether the pointer has left the page. Getter-backed. */
	readonly value: boolean;
}

/** Mouse event with the legacy IE `toElement` escape hatch. */
interface MouseEventWithLegacyTarget extends MouseEvent {
	toElement?: EventTarget | null;
}

/**
 * Track whether the pointer left the page.
 */
export function usePageLeave(): UsePageLeaveReturn {
	let left = $state(false);

	if (isBrowser) {
		const handler = (event: MouseEvent) => {
			const from = event.relatedTarget ?? (event as MouseEventWithLegacyTarget).toElement ?? null;
			left = !from;
		};

		const options = { passive: true } as const;
		useEventListener(() => window, 'mouseout', handler, options);
		useEventListener(() => document, 'mouseleave', handler, options);
		useEventListener(() => document, 'mouseenter', handler, options);
	}

	return {
		get value() {
			return left;
		}
	};
}
