import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { usePreferredDark } from '../usePreferredDark/index.svelte.ts';
import { useStorage } from '../../state/useStorage/index.svelte.ts';

/** Built-in color modes. */
export type BasicColorMode = 'light' | 'dark';

/** Stored mode: a concrete mode or follow-the-system. */
export type BasicColorSchema = BasicColorMode | 'auto';

/** Options for {@link useColorMode}. */
export interface UseColorModeOptions<T extends string = BasicColorMode> {
	/**
	 * Selector or element receiving the mode marker.
	 * @default 'html'
	 */
	selector?: string | MaybeGetter<Element | null | undefined>;
	/**
	 * Attribute carrying the mode (`'class'` toggles classes).
	 * @default 'class'
	 */
	attribute?: string;
	/**
	 * Starting mode. Resolved once at creation.
	 * @default 'auto'
	 */
	initialValue?: MaybeGetter<T | BasicColorSchema>;
	/**
	 * Class (or attribute value) per mode.
	 * @default { auto: '', light: 'light', dark: 'dark' }
	 */
	modes?: Partial<Record<T | BasicColorSchema, string>>;
	/**
	 * Custom change handler. When provided, the default DOM update is
	 * skipped unless `defaultHandler` is called.
	 */
	onChanged?: (
		mode: T | BasicColorMode,
		defaultHandler: (mode: T | BasicColorMode) => void
	) => void;
	/**
	 * External store. Must expose a mutable `value`; reactivity across
	 * instances requires it to be reactive (e.g. another util's return).
	 * Skips persistence when provided.
	 */
	storageRef?: { value: T | BasicColorSchema };
	/**
	 * Persistence key. `null` disables persistence.
	 * @default 'sv-color-scheme'
	 */
	storageKey?: string | null;
	/**
	 * Storage backend. Only read in the browser.
	 * @default localStorage
	 */
	storage?: Storage | null;
	/**
	 * Suppress CSS transitions while switching.
	 * @default true
	 */
	disableTransition?: boolean;
}

/** State returned by {@link useColorMode}. */
export interface UseColorModeReturn<T extends string = BasicColorMode> {
	/** Effective mode. Assign to change. Getter/setter-backed. */
	value: T | BasicColorMode;
	/** Stored mode (`'auto'` included). Assign to change. Getter/setter-backed. */
	store: T | BasicColorSchema;
	/** System mode from the OS preference. Getter-backed. */
	readonly system: BasicColorMode;
	/** Effective mode (same as `value`). Getter-backed. */
	readonly state: T | BasicColorMode;
}

const CSS_DISABLE_TRANS =
	'*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}';

/**
 * Reactive color mode with persistence and DOM syncing.
 *
 * @param options Selector, attribute, modes, storage, transitions.
 * @example
 * ```ts
 * const mode = useColorMode();
 * mode.value = 'dark'; // persisted + applied to <html>
 * mode.store; // 'dark' ('auto' would follow the system)
 * ```
 */
export function useColorMode<T extends string = BasicColorMode>(
	options: UseColorModeOptions<T> = {}
): UseColorModeReturn<T> {
	const {
		selector = 'html',
		attribute = 'class',
		initialValue = 'auto',
		storageKey = 'sv-color-scheme',
		storage,
		storageRef,
		disableTransition = true
	} = options;

	const modes = {
		auto: '',
		light: 'light',
		dark: 'dark',
		...(options.modes ?? {})
	} as Record<BasicColorSchema | T, string>;

	const preferredDark = usePreferredDark();
	const initial = resolveGetter(initialValue);

	let localValue = $state<T | BasicColorSchema>(initial);
	const persisted =
		!storageRef && storageKey != null
			? useStorage<T | BasicColorSchema>(storageKey, initial, () => storage ?? localStorage)
			: undefined;

	function getStore(): T | BasicColorSchema {
		if (storageRef) return storageRef.value;
		if (persisted) return persisted.value;
		return localValue;
	}

	function setStore(next: T | BasicColorSchema) {
		if (storageRef) storageRef.value = next;
		else if (persisted) persisted.value = next;
		else localValue = next;
	}

	function getSystem(): BasicColorMode {
		return preferredDark.value ? 'dark' : 'light';
	}

	function getState(): T | BasicColorMode {
		const stored = getStore();
		return stored === 'auto' ? getSystem() : stored;
	}

	function updateAttributes(mode: T | BasicColorMode) {
		if (!isBrowser || typeof document === 'undefined') return;
		const element =
			typeof selector === 'string' ? document.querySelector(selector) : resolveGetter(selector);
		if (!element) return;
		const value = modes[mode] ?? mode;

		if (attribute !== 'class') {
			element.setAttribute(attribute, value);
			return;
		}
		const current = value.split(/\s/g);
		const known = Object.values(modes)
			.flatMap((entry) => (entry || '').split(/\s/g))
			.filter(Boolean);
		const toAdd: string[] = [];
		const toRemove: string[] = [];
		for (const entry of known) {
			if (current.includes(entry)) {
				if (!toAdd.includes(entry)) toAdd.push(entry);
			} else if (!toRemove.includes(entry)) {
				toRemove.push(entry);
			}
		}
		if (toAdd.length === 0 && toRemove.length === 0) return;
		let transitionGuard: HTMLStyleElement | undefined;
		if (disableTransition) {
			transitionGuard = document.createElement('style');
			transitionGuard.appendChild(document.createTextNode(CSS_DISABLE_TRANS));
			document.head.appendChild(transitionGuard);
		}
		for (const entry of toAdd) element.classList.add(entry);
		for (const entry of toRemove) element.classList.remove(entry);
		if (transitionGuard) {
			// Force a reflow so the switch applies without transitions.
			void window.getComputedStyle(transitionGuard).opacity;
			document.head.removeChild(transitionGuard);
		}
	}

	function defaultOnChanged(mode: T | BasicColorMode) {
		updateAttributes(mode);
	}

	if (isBrowser) {
		$effect(() => {
			const mode = getState();
			untrack(() => {
				if (options.onChanged) options.onChanged(mode, defaultOnChanged);
				else defaultOnChanged(mode);
			});
		});
	}

	return {
		get value() {
			return getState();
		},
		set value(next: T | BasicColorMode) {
			setStore(next);
		},
		get store() {
			return getStore();
		},
		set store(next: T | BasicColorSchema) {
			setStore(next);
		},
		get system() {
			return getSystem();
		},
		get state() {
			return getState();
		}
	};
}
