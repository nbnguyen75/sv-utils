import { isBrowser } from '../../shared/is.ts';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import { useEventListener } from '../useEventListener/index.svelte.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Default key aliases (all lowercase). */
export const DefaultMagicKeysAliasMap: Readonly<Record<string, string>> = {
	ctrl: 'control',
	command: 'meta',
	cmd: 'meta',
	option: 'alt',
	up: 'arrowup',
	down: 'arrowdown',
	left: 'arrowleft',
	right: 'arrowright'
};

/** Options for {@link useMagicKeys}. */
export interface UseMagicKeysOptions {
	/**
	 * Element (or getter) receiving keyboard events.
	 * @default window
	 */
	target?: MaybeGetter<EventTarget>;
	/**
	 * Alias map for keys. All keys must be lowercase.
	 * @example { ctrl: 'control' }
	 * @default DefaultMagicKeysAliasMap
	 */
	aliasMap?: Record<string, string>;
	/**
	 * Register listeners as passive.
	 * @default true
	 */
	passive?: boolean;
	/**
	 * Custom handler for keydown/keyup events. Return value is ignored.
	 */
	onEventFired?: (event: KeyboardEvent) => void | boolean;
}

/** Internal bookkeeping exposed by {@link useMagicKeys}. */
export interface MagicKeysInternal {
	/**
	 * Currently pressed keys (raw `event.key` values).
	 */
	current: Set<string>;
}

/** State returned by {@link useMagicKeys}. */
export type UseMagicKeysReturn = Readonly<Record<string, boolean> & MagicKeysInternal>;

/**
 * Reactive pressed-key state with combination support.
 *
 * Access any key by name (`keys.shift`), alias (`keys.ctrl`), or
 * combination (`keys['control+a']`); unknown keys start untracked and
 * flip live once pressed.
 *
 * @param options Target, alias map, passive mode, event hook.
 * @example
 * ```ts
 * const keys = useMagicKeys();
 * keys['meta+k']; // true while both are held
 * ```
 */
export function useMagicKeys(options: UseMagicKeysOptions = {}): UseMagicKeysReturn {
	const {
		target,
		aliasMap = DefaultMagicKeysAliasMap,
		passive = true,
		onEventFired = () => {}
	} = options;

	const current = new SvelteSet<string>();
	const flags = $state<Record<string, boolean>>({});
	const metaDeps = new SvelteSet<string>();
	const depsMap = new SvelteMap<string, SvelteSet<string>>([
		['Meta', metaDeps],
		['Shift', new SvelteSet<string>()],
		['Alt', new SvelteSet<string>()]
	]);
	const usedKeys = new SvelteSet<string>();

	function setFlag(key: string, value: boolean) {
		if (key in flags) flags[key] = value;
	}

	function reset() {
		current.clear();
		for (const key of usedKeys) setFlag(key, false);
	}

	function updateDeps(value: boolean, event: KeyboardEvent, keys: string[]) {
		if (!value || typeof event.getModifierState !== 'function') return;
		for (const [modifier, depsSet] of depsMap) {
			if (event.getModifierState(modifier)) {
				for (const key of keys) depsSet.add(key);
				break;
			}
		}
	}

	function clearDeps(value: boolean, key: string) {
		if (value) return;
		const first = key[0];
		if (!first) return;
		const deps = depsMap.get(`${first.toUpperCase()}${key.slice(1)}`);
		if (!['shift', 'alt'].includes(key) || !deps) return;
		const depsArray = Array.from(deps);
		const depsIndex = depsArray.indexOf(key);
		depsArray.forEach((dep, index) => {
			if (index >= depsIndex) {
				current.delete(dep);
				setFlag(dep, false);
			}
		});
		deps.clear();
	}

	function updateFlags(event: KeyboardEvent, value: boolean) {
		const key = event.key?.toLowerCase();
		const code = event.code?.toLowerCase();
		if (!key) return;
		if (value) current.add(key);
		else current.delete(key);
		for (const part of [code, key]) {
			if (!part) continue;
			usedKeys.add(part);
			setFlag(part, value);
		}
		updateDeps(
			value,
			event,
			[...current, code, key].filter((part) => part !== '')
		);
		clearDeps(value, key);
		// In macOS, keys miss their keyup when Meta releases: drop the
		// whole tracked combination manually.
		if (key === 'meta' && !value) {
			for (const dep of metaDeps) {
				current.delete(dep);
				setFlag(dep, false);
			}
			metaDeps.clear();
		}
	}

	/** Resolve one key name (aliases + combinations) against live flags. */
	function readKey(key: string): boolean {
		const normalized = key.toLowerCase();
		const aliased = aliasMap[normalized] ?? normalized;
		if (/[+_-]/.test(aliased)) {
			return aliased
				.split(/[+_-]/g)
				.map((part) => part.trim())
				.every((part) => readKey(part));
		}
		// Lazily track on first access (mirrors upstream's ref creation).
		if (!(aliased in flags)) flags[aliased] = false;
		return flags[aliased] ?? false;
	}

	if (isBrowser) {
		const listenTarget = target ?? (() => window);
		useEventListener(
			listenTarget,
			'keydown',
			(event) => {
				const keyboardEvent = event as KeyboardEvent;
				updateFlags(keyboardEvent, true);
				onEventFired(keyboardEvent);
			},
			{ passive }
		);
		useEventListener(
			listenTarget,
			'keyup',
			(event) => {
				const keyboardEvent = event as KeyboardEvent;
				updateFlags(keyboardEvent, false);
				onEventFired(keyboardEvent);
			},
			{ passive }
		);
		// Releasing outside the window loses keyup: reset on blur/focus.
		useEventListener(
			() => window,
			'blur',
			() => reset(),
			{ passive }
		);
		useEventListener(
			() => window,
			'focus',
			() => reset(),
			{ passive }
		);
	}

	const proxy = new Proxy(
		{
			toJSON: () => ({}),
			current
		},
		{
			get(holder, property, receiver) {
				if (typeof property !== 'string') return Reflect.get(holder, property, receiver);
				const normalized = property.toLowerCase();
				if (normalized === 'current' || normalized === 'tojson') {
					return Reflect.get(holder, property, receiver);
				}
				return readKey(normalized);
			}
		}
	);
	// The proxy intentionally presents a wider shape (any key name) than
	// its holder object.
	return proxy as unknown as UseMagicKeysReturn;
}
