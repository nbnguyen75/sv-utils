/**
 * Reactive dark-mode state synced to the DOM and persisted to storage.
 *
 * Inspired by VueUse `useDark`. Tracks the
 * OS `prefers-color-scheme` media query, persists the `light | dark | auto`
 * mode via `useLocalStorage`, and toggles `class="dark"` (or a custom
 * attribute) on the selector target. Simplified: no VueUse `useColorMode`
 * custom-mode dictionary — see `useColorMode` (feat-022) for that.
 * Must be called in component initialization (uses `$state` / `$effect`).
 */
import { isBrowser } from '../../shared/is.ts';
import { useLocalStorage } from '../../state/useStorage/index.svelte.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** Options for {@link useDark}. */
export interface UseDarkOptions {
	/**
	 * Storage key for the persisted color-scheme mode.
	 * @default 'sv-color-scheme'
	 */
	storageKey?: string;
	/**
	 * Attribute to write on the selector target; `'class'` toggles the
	 * `dark` class, any other name sets `attribute="dark" | "light"`.
	 * @default 'class'
	 */
	attribute?: string;
	/**
	 * Element selector receiving the dark-mode marker.
	 * @default 'html'
	 */
	selector?: string;
}

/** Color-scheme mode persisted by {@link useDark}. */
export type UseDarkMode = 'light' | 'dark' | 'auto';

/** Reactive dark-mode state returned by {@link useDark}. */
export interface UseDarkReturn {
	/** Effective dark state (stored mode, or OS preference in `auto`). Getter-backed (destructure-safe). */
	readonly value: boolean;
	/** Flip between explicit `light` and `dark` (resolves `auto` first). */
	toggle(): void;
	/** Persist a mode, or return to OS-driven `auto`. */
	setMode(mode: UseDarkMode): void;
}

/**
 * Dark-mode controller. During SSR the value is `false` and no DOM or
 * storage is touched; the client hydrates from storage, then OS preference.
 *
 * @param opts `storageKey`, `attribute`, and `selector` overrides.
 * @returns Getter-backed `value` plus `toggle` and `setMode`.
 */
export function useDark(opts: UseDarkOptions = {}): UseDarkReturn {
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

	const stored = useLocalStorage<UseDarkMode>(storageKey, 'auto');

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
		setMode(mode: UseDarkMode) {
			stored.value = mode;
		}
	};
}
