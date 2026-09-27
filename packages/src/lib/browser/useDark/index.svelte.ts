import { useEventListener } from '../useEventListener/index.svelte.ts';
import { useLocalStorage } from '../../state/useStorage/index.svelte.ts';
import { isBrowser } from '../../shared/is.ts';

export interface UseDarkOptions {
	storageKey?: string;
	selector?: string;
	attribute?: string;
}

export function useDark(opts: UseDarkOptions = {}) {
	const storageKey = opts.storageKey ?? 'sv-color-scheme';
	const selector = opts.selector ?? 'html';
	const attribute = opts.attribute ?? 'class';

	const preferred = $state({
		value: isBrowser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
	});

	if (isBrowser) {
		useEventListener(
			() => window.matchMedia('(prefers-color-scheme: dark)'),
			'change',
			(e) => (preferred.value = (e as MediaQueryListEvent).matches)
		);
	}

	const stored = useLocalStorage<'light' | 'dark' | 'auto'>(storageKey, 'auto');

	const isDark = $derived(stored.value === 'auto' ? preferred.value : stored.value === 'dark');

	$effect(() => {
		if (!isBrowser) return;
		const el = document.querySelector(selector);
		if (!el) return;

		if (attribute === 'class') {
			el.classList.toggle('dark', isDark);
		} else {
			el.setAttribute(attribute, isDark ? 'dark' : 'light');
		}
	});

	return {
		get value() {
			return isDark;
		},
		toggle() {
			stored.value = isDark ? 'light' : 'dark';
		},
		setMode(mode: 'light' | 'dark' | 'auto') {
			stored.value = mode;
		}
	};
}
