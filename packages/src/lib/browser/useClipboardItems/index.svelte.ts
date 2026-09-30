import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';
import { useTimeoutFn } from '../../utilities/useTimeoutFn/index.svelte.ts';

/** Options for {@link useClipboardItems}. */
export interface UseClipboardItemsOptions<Source> {
	/**
	 * Refresh `content` on copy/cut events.
	 * @default false
	 */
	read?: boolean;
	/** Default content for `copy()` when called without arguments. */
	source?: Source;
	/**
	 * Milliseconds until `copied` resets.
	 * @default 1500
	 */
	copiedDuring?: number;
	/**
	 * Navigator to use. `null` disables. Defaults to the global navigator.
	 */
	navigator?: Navigator | null;
}

/** State returned by {@link useClipboardItems}. */
export interface UseClipboardItemsReturn<Optional> {
	/** Whether the Clipboard API exists here. */
	readonly isSupported: boolean;
	/** Last written or read items. Getter-backed. */
	readonly content: ClipboardItems;
	/** Whether the last write is still fresh. Getter-backed. */
	readonly copied: boolean;
	/** Write items to the clipboard. */
	copy: Optional extends true
		? (content?: ClipboardItems) => Promise<void>
		: (content: ClipboardItems) => Promise<void>;
	/** Read the clipboard into `content` now. */
	read(): void;
}

/**
 * Reactive Clipboard API for rich items.
 *
 * @param options Read mode, default source, reset delay, navigator.
 * @example
 * ```ts
 * const { copy, copied } = useClipboardItems();
 * await copy([new ClipboardItem({ 'text/plain': blob })]);
 * copied; // true for 1.5s
 * ```
 */
export function useClipboardItems(
	options?: UseClipboardItemsOptions<undefined>
): UseClipboardItemsReturn<false>;
/**
 * Reactive Clipboard API for rich items, with a default source.
 *
 * @param options Read mode, default source, reset delay, navigator.
 * @example
 * ```ts
 * const { copy } = useClipboardItems({ source: () => items });
 * await copy(); // writes the source
 * ```
 */
export function useClipboardItems(
	options: UseClipboardItemsOptions<MaybeGetter<ClipboardItems>>
): UseClipboardItemsReturn<true>;

// Implementation
export function useClipboardItems(
	options: UseClipboardItemsOptions<MaybeGetter<ClipboardItems> | undefined> = {}
): UseClipboardItemsReturn<boolean> {
	const { read = false, source, copiedDuring = 1500, navigator: navOption } = options;

	function getNavigator(): Navigator | undefined {
		if (navOption === undefined) {
			return isBrowser && typeof navigator !== 'undefined' ? navigator : undefined;
		}
		return navOption ?? undefined;
	}

	const nav = getNavigator();
	const isSupported = nav !== undefined && 'clipboard' in nav;

	let content = $state<ClipboardItems>([]);
	let copied = $state(false);
	const resetCopied = useTimeoutFn(
		() => {
			copied = false;
		},
		copiedDuring,
		{ immediate: false }
	);

	function updateContent() {
		const target = getNavigator();
		if (target && 'clipboard' in target) {
			void target.clipboard.read().then((items) => {
				content = items;
			});
		}
	}

	if (isBrowser && isSupported && read) {
		useEventListener(
			() => window,
			'copy',
			() => updateContent(),
			{ passive: true }
		);
		useEventListener(
			() => window,
			'cut',
			() => updateContent(),
			{ passive: true }
		);
	}

	async function copy(value?: ClipboardItems): Promise<void> {
		const target = getNavigator();
		const items = value ?? resolveGetter(source);
		if (!target || !('clipboard' in target) || items == null) return;
		await target.clipboard.write(items);
		content = items;
		copied = true;
		resetCopied.start();
	}

	return {
		isSupported,
		get content() {
			return content;
		},
		get copied() {
			return copied;
		},
		copy,
		read: updateContent
	};
}
