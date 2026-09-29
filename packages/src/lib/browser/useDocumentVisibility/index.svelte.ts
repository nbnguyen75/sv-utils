import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Visibility state returned by {@link useDocumentVisibility}. */
export interface UseDocumentVisibilityReturn {
	/** Current visibility. Getter-backed (destructure-safe). */
	readonly value: DocumentVisibilityState;
}

/**
 * Track whether the document is visible.
 * @example
 * ```ts
 * const visibility = useDocumentVisibility();
 * visibility.value; // 'visible' | 'hidden'
 * ```
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
