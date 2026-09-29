import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options for {@link useFavicon}. */
export interface UseFaviconOptions {
	/**
	 * Prefix prepended to icon paths.
	 * @default ''
	 */
	baseUrl?: string;
	/**
	 * Link `rel` to match and create.
	 * @default 'icon'
	 */
	rel?: string;
}

/** Favicon state returned by {@link useFavicon}. */
export interface UseFaviconReturn {
	/** Current icon path (`null`/`undefined` clears nothing). Getter/setter-backed. */
	value: string | null | undefined;
}

/**
 * Reactive favicon, applied to the document on change.
 * @example
 * ```ts
 * const icon = useFavicon('app.png');
 * icon.value = 'alert.png'; // swaps href immediately
 * ```
 */

export function useFavicon(newIcon: MaybeGetter<string | null | undefined>): UseFaviconReturn;
export function useFavicon(
	newIcon?: MaybeGetter<string | null | undefined>,
	options?: UseFaviconOptions
): UseFaviconReturn;
export function useFavicon(
	newIcon: MaybeGetter<string | null | undefined> = null,
	options: UseFaviconOptions = {}
): UseFaviconReturn {
	const { baseUrl = '', rel = 'icon' } = options;

	function applyIcon(icon: string) {
		if (!isBrowser) return;
		const selector = `link[rel*="${rel}"]`;
		const existing = document.head.querySelectorAll<HTMLLinkElement>(selector);
		if (existing.length === 0) {
			const link = document.createElement('link');
			link.rel = rel;
			link.href = `${baseUrl}${icon}`;
			link.type = `image/${icon.split('.').pop()}`;
			document.head.append(link);
			return;
		}
		for (const element of existing) element.href = `${baseUrl}${icon}`;
	}

	let icon = $state<string | null | undefined>(resolveGetter(newIcon));

	if (isBrowser) {
		let first = true;
		$effect(() => {
			const next = resolveGetter(newIcon);
			untrack(() => {
				if (typeof next !== 'string') {
					first = false;
					return;
				}
				// Always apply on mount (VueUse `immediate: true`); afterwards
				// only on genuine changes.
				if (first || next !== icon) {
					first = false;
					icon = next;
					applyIcon(next);
				}
			});
		});
	}

	return {
		get value() {
			return icon;
		},
		set value(next: string | null | undefined) {
			icon = next;
			if (typeof next === 'string') applyIcon(next);
		}
	};
}
