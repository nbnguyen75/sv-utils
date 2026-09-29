import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';
import { useEventListener } from '../../browser/useEventListener/index.svelte.ts';

/** Options for {@link useFullscreen}. */
export interface UseFullscreenOptions {
	/**
	 * Exit fullscreen when the component unmounts.
	 * @default false
	 */
	autoExit?: boolean;
}

/** State returned by {@link useFullscreen}. */
export interface UseFullscreenReturn {
	/** Whether the Fullscreen API is available here. Getter-backed. */
	readonly isSupported: boolean;
	/** Whether the target is currently fullscreen. Getter-backed. */
	readonly isFullscreen: boolean;
	/** Enter fullscreen (no-op when unsupported or already fullscreen). */
	enter(): Promise<void>;
	/** Exit fullscreen (no-op when unsupported or not fullscreen). */
	exit(): Promise<void>;
	/** Toggle between `enter` and `exit`. */
	toggle(): Promise<void>;
}

const FULLSCREEN_EVENTS = [
	'fullscreenchange',
	'webkitfullscreenchange',
	'webkitendfullscreen',
	'mozfullscreenchange',
	'MSFullscreenChange'
];

const REQUEST_METHODS = [
	'requestFullscreen',
	'webkitRequestFullscreen',
	'webkitEnterFullscreen',
	'webkitEnterFullScreen',
	'webkitRequestFullScreen',
	'mozRequestFullScreen',
	'msRequestFullscreen'
];

const EXIT_METHODS = [
	'exitFullscreen',
	'webkitExitFullscreen',
	'webkitExitFullScreen',
	'webkitCancelFullScreen',
	'mozCancelFullScreen',
	'msExitFullscreen'
];

const ENABLED_FLAGS = [
	'fullScreen',
	'webkitIsFullScreen',
	'webkitDisplayingFullscreen',
	'mozFullScreen',
	'msFullscreenElement'
];

const ELEMENT_PROPS = [
	'fullscreenElement',
	'webkitFullscreenElement',
	'mozFullScreenElement',
	'msFullscreenElement'
];

function findMethod(
	holder: object | null | undefined,
	names: readonly string[]
): string | undefined {
	if (!holder) return undefined;
	return names.find((name) => name in holder);
}

function readFlag(holder: object | null | undefined, method: string | undefined): unknown {
	if (!holder || !method) return undefined;
	return (holder as Record<string, unknown>)[method];
}

async function invokeMethod(
	holder: object | null | undefined,
	method: string | undefined
): Promise<void> {
	if (!holder || !method) return;
	const fn = (holder as Record<string, unknown>)[method];
	if (typeof fn === 'function') await fn.call(holder);
}

/**
 * Fullscreen controls for an element (default: the document element).
 *
 * @param target Element or getter; omitted means `document.documentElement`.
 * @param options `autoExit` on unmount.
 * @example
 * ```ts
 * const screen = useFullscreen(() => player);
 * await screen.toggle();
 * ```
 */
export function useFullscreen(
	target?: MaybeElement,
	options: UseFullscreenOptions = {}
): UseFullscreenReturn {
	const { autoExit = false } = options;

	const targetElement = $derived(
		target === undefined
			? isBrowser
				? document.documentElement
				: undefined
			: (resolveGetter(target) ?? undefined)
	);

	const requestMethod = $derived(
		findMethod(isBrowser ? document : undefined, REQUEST_METHODS) ??
			findMethod(targetElement, REQUEST_METHODS)
	);
	const exitMethod = $derived(
		findMethod(isBrowser ? document : undefined, EXIT_METHODS) ??
			findMethod(targetElement, EXIT_METHODS)
	);
	const enabledFlag = $derived(
		findMethod(isBrowser ? document : undefined, ENABLED_FLAGS) ??
			findMethod(targetElement, ENABLED_FLAGS)
	);
	const elementProp = $derived(findMethod(isBrowser ? document : undefined, ELEMENT_PROPS));

	const isSupported = $derived(
		isBrowser &&
			targetElement !== undefined &&
			requestMethod !== undefined &&
			exitMethod !== undefined &&
			enabledFlag !== undefined
	);

	let isFullscreen = $state(false);

	function isCurrentElementFullscreen(): boolean {
		if (!isBrowser || !elementProp) return false;
		return readFlag(document, elementProp) === targetElement;
	}

	function isElementFullscreen(): boolean {
		const flag = readFlag(isBrowser ? document : undefined, enabledFlag);
		if (flag != null) return flag as boolean;
		const target = targetElement;
		if (target && enabledFlag) {
			const fallback = readFlag(target, enabledFlag);
			if (fallback != null) return Boolean(fallback);
		}
		return false;
	}

	async function exit(): Promise<void> {
		if (!isSupported || !isFullscreen) return;
		if (isBrowser && exitMethod) {
			const onDocument = readFlag(document, exitMethod);
			if (onDocument != null) await invokeMethod(document, exitMethod);
			else await invokeMethod(targetElement, exitMethod);
		}
		isFullscreen = false;
	}

	async function enter(): Promise<void> {
		if (!isSupported || isFullscreen) return;
		if (isElementFullscreen()) await exit();
		const element = targetElement;
		if (requestMethod && element) {
			const method = readFlag(element, requestMethod);
			if (method != null) {
				await invokeMethod(element, requestMethod);
				isFullscreen = true;
			}
		}
	}

	async function toggle(): Promise<void> {
		if (isFullscreen) await exit();
		else await enter();
	}

	function sync() {
		const active = isElementFullscreen();
		if (!active || (active && isCurrentElementFullscreen())) isFullscreen = active;
	}

	if (isBrowser) {
		for (const name of FULLSCREEN_EVENTS) {
			useEventListener(() => document, name, sync, { capture: false, passive: true });
			useEventListener(() => targetElement, name, sync, { capture: false, passive: true });
		}

		$effect(() => {
			// Sync on mount and whenever the target swaps (transitive
			// reads inside sync() subscribe this effect).
			sync();
		});

		if (autoExit) {
			$effect(() => {
				return () => {
					void exit();
				};
			});
		}
	}

	return {
		get isSupported() {
			return isSupported;
		},
		get isFullscreen() {
			return isFullscreen;
		},
		enter,
		exit,
		toggle
	};
}
