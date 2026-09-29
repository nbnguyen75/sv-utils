import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Language state returned by {@link useNavigatorLanguage}. */
export interface UseNavigatorLanguageReturn {
	/** Whether the language API is available in this environment. */
	readonly isSupported: boolean;
	/** BCP 47 language tag, refreshing on `languagechange`. Getter-backed. */
	readonly language: string | undefined;
}

/**
 * Track the browser's active language.
 * @example
 * ```ts
 * const { isSupported, language } = useNavigatorLanguage();
 * language; // e.g. 'en-US'
 * ```
 */
export function useNavigatorLanguage(): UseNavigatorLanguageReturn {
	const navigatorRef = isBrowser ? window.navigator : undefined;
	const isSupported = !!navigatorRef && 'language' in navigatorRef;

	let language = $state<string | undefined>(navigatorRef?.language);

	if (isSupported) {
		useEventListener(
			() => window,
			'languagechange',
			() => {
				language = window.navigator.language;
			},
			{ passive: true }
		);
	}

	return {
		isSupported,
		get language() {
			return language;
		}
	};
}
