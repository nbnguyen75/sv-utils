/**
 * Shared vitest setup (runs once per test file, in every environment).
 *
 * - Installs a controllable `window.matchMedia` stub when a DOM is present
 *   (jsdom ships none). Tests drive it via `setMediaMatches()`.
 * - Resets timer mocks and the media-query registry after each test.
 */
import { afterEach, vi } from 'vitest';

type MediaChangeListener = (event: MediaQueryListEvent) => void;

const mediaStates = new Map<string, boolean>();
const mediaListeners = new Map<string, Set<MediaChangeListener>>();

function createMediaQueryList(query: string): MediaQueryList {
	const listeners = new Set<MediaChangeListener>();
	mediaListeners.set(query, listeners);
	return {
		addEventListener(type: string, callback: EventListenerOrEventListenerObject | null) {
			if (type === 'change' && typeof callback === 'function') {
				listeners.add(callback as MediaChangeListener);
			}
		},
		addListener(callback: ((event: MediaQueryListEvent) => void) | null) {
			if (typeof callback === 'function') listeners.add(callback);
		},
		dispatchEvent() {
			return false;
		},
		get matches() {
			return mediaStates.get(query) ?? false;
		},
		media: query,
		onchange: null,
		removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null) {
			if (type === 'change' && typeof callback === 'function') {
				listeners.delete(callback as MediaChangeListener);
			}
		},
		removeListener(callback: ((event: MediaQueryListEvent) => void) | null) {
			if (typeof callback === 'function') listeners.delete(callback);
		}
	};
}

/**
 * Drive the `matchMedia` stub: set `matches` for `query` and notify
 * registered `change` listeners, mirroring a real OS/browser change.
 */
export function setMediaMatches(query: string, matches: boolean): void {
	mediaStates.set(query, matches);
	const listeners = mediaListeners.get(query);
	if (!listeners) return;
	const event = { matches, media: query } as unknown as MediaQueryListEvent;
	for (const listener of listeners) listener(event);
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
	window.matchMedia = (query: string): MediaQueryList => createMediaQueryList(query);
}

afterEach(() => {
	mediaStates.clear();
	mediaListeners.clear();
	vi.useRealTimers();
	vi.restoreAllMocks();
});
