/**
 * Reactive navigator language with support detection.
 *
 * Inspired by [VueUse `useNavigatorLanguage`](https://vueuse.org/core/useNavigatorLanguage/).
 * Must be called in component initialization. Server output is
 * `{ isSupported: false, language: undefined }`. Disposal on unmount is
 * automatic.
 */
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
