/**
 * Reactive `document.visibilityState`.
 *
 * Inspired by [VueUse `useDocumentVisibility`](https://vueuse.org/core/useDocumentVisibility/).
 * Refreshes on `visibilitychange`. Must be called in component
 * initialization. Server value is `'visible'`. Disposal on unmount is
 * automatic.
 */
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Visibility state returned by {@link useDocumentVisibility}. */
export interface UseDocumentVisibilityReturn {
	/** Current visibility. Getter-backed (destructure-safe). */
	readonly value: DocumentVisibilityState;
}

/**
 * Track whether the document is visible.
 */
export function useDocumentVisibility(): UseDocumentVisibilityReturn {
	let visibility = $state<DocumentVisibilityState>(
		isBrowser ? document.visibilityState : 'visible'
	);

	if (isBrowser) {
		useEventListener(
			() => document,
			'visibilitychange',
			() => {
				visibility = document.visibilityState;
			},
			{ passive: true }
		);
	}

	return {
		get value() {
			return visibility;
		}
	};
}
