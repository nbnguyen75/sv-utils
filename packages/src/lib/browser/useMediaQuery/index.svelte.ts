/**
 * Reactive CSS media-query matching.
 *
 * Inspired by [VueUse `useMediaQuery`](https://vueuse.org/core/useMediaQuery/).
 * Subscribes to a `MediaQueryList` inside `$effect` (re-subscribing when a
 * reactive query changes), so this must be called in component
 * initialization. Server output is the `ssrMatches` fallback; the client
 * hydrates from the live query. Disposal on unmount is automatic.
 */
import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options for {@link useMediaQuery}. */
export interface UseMediaQueryOptions {
	/**
	 * Value reported when media queries are unavailable (SSR or missing
	 * `matchMedia`). Pick the server render to avoid hydration mismatch.
	 * @default false
	 */
	ssrMatches?: boolean;
}

/** Match state returned by {@link useMediaQuery}. */
export interface UseMediaQueryReturn {
	/** Whether the query currently matches. Getter-backed (destructure-safe). */
	readonly value: boolean;
}

function queryMatches(query: string): boolean {
	try {
		return window.matchMedia(query).matches;
	} catch {
		return false;
	}
}

/**
 * Track whether a media query matches.
 *
 * @param query CSS media query, or a getter for one (changing it re-subscribes).
 * @param options `ssrMatches` server fallback.
 */
export function useMediaQuery(
	query: MaybeGetter<string>,
	options: UseMediaQueryOptions = {}
): UseMediaQueryReturn {
	const { ssrMatches = false } = options;
	const supported = isBrowser && typeof window.matchMedia === 'function';

	let matches = $state(supported ? queryMatches(resolveGetter(query)) : ssrMatches);

	if (supported) {
		$effect(() => {
			const current = resolveGetter(query);
			let list: MediaQueryList;
			try {
				list = window.matchMedia(current);
			} catch {
				return;
			}
			const onChange = (event: MediaQueryListEvent) => {
				matches = event.matches;
			};
			// Re-sync on (re)subscribe: the query may have changed.
			matches = list.matches;
			list.addEventListener('change', onChange);
			return () => {
				list.removeEventListener('change', onChange);
			};
		});
	}

	return {
		get value() {
			return matches;
		}
	};
}
