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
 * @example
 * ```ts
 * const languages = usePreferredLanguages();
 * languages.value[0]; // e.g. 'en-US'
 * ```
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
