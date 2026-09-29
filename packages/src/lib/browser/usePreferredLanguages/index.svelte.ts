/**
 * Reactive navigator languages.
 *
 * Inspired by [VueUse `usePreferredLanguages`](https://vueuse.org/core/usePreferredLanguages/).
 * Starts from `navigator.languages` (or `['en']` on the server) and
 * refreshes on `languagechange`. Must be called in component
 * initialization. Disposal on unmount is automatic.
 */
import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Language state returned by {@link usePreferredLanguages}. */
export interface UsePreferredLanguagesReturn {
	/** Preferred locales, most preferred first. Getter-backed. */
	readonly value: readonly string[];
}

function readLanguages(): readonly string[] {
	if (!isBrowser || typeof navigator === 'undefined') return ['en'];
	return navigator.languages ?? ['en'];
}

/**
 * Track the browser's preferred languages.
 */
export function usePreferredLanguages(): UsePreferredLanguagesReturn {
	let languages = $state<readonly string[]>(readLanguages());

	if (isBrowser) {
		useEventListener(
			() => window,
			'languagechange',
			() => {
				languages = readLanguages();
			},
			{ passive: true }
		);
	}

	return {
		get value() {
			return languages;
		}
	};
}
