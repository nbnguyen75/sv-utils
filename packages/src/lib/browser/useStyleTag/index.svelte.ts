import { untrack } from 'svelte';

import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** Options for {@link useStyleTag}. */
export interface UseStyleTagOptions {
	/**
	 * Document receiving the tag. `null` disables.
	 * @default document
	 */
	document?: Document | null;
	/** Media query the styles apply under. */
	media?: string;
	/**
	 * Load on mount.
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Manual timing: skip auto load and auto unload.
	 * @default false
	 */
	manual?: boolean;
	/**
	 * DOM id of the tag (shared ids ref-count).
	 * @default auto-incremented
	 */
	id?: string;
	/** Nonce for Content Security Policy. */
	nonce?: string;
}

/** State returned by {@link useStyleTag}. */
export interface UseStyleTagReturn {
	/** DOM id of the tag. */
	readonly id: string;
	/** Current CSS text. Getter-backed. */
	readonly css: string;
	/** Append the tag (idempotent per instance) and apply the CSS. */
	load(): void;
	/** Release the tag (removes it once the last user unloads). */
	unload(): void;
	/** Whether this instance holds the tag. Getter-backed. */
	readonly isLoaded: boolean;
}

let styleIdCounter = 0;
const refCounts = new WeakMap<HTMLStyleElement, number>();

/**
 * Inject a `<style>` element into `<head>`, with ref-counted sharing.
 *
 * @param css CSS text (or getter); re-applied while loaded.
 * @param options Media, timing, id, nonce, document.
 * @example
 * ```ts
 * const { unload } = useStyleTag(() => `.theme { color: ${color}; }`);
 * ```
 */
export function useStyleTag(
	css: MaybeGetter<string>,
	options: UseStyleTagOptions = {}
): UseStyleTagReturn {
	const {
		document: docOption,
		immediate = true,
		manual = false,
		id = `sv_styletag_${(styleIdCounter += 1)}`,
		nonce,
		media
	} = options;

	let isLoaded = $state(false);

	function getDocument(): Document | undefined {
		if (docOption === undefined) {
			return isBrowser && typeof document !== 'undefined' ? document : undefined;
		}
		return docOption ?? undefined;
	}

	function asStyleElement(node: Element | null): HTMLStyleElement | undefined {
		if (node && node.tagName === 'STYLE') return node as HTMLStyleElement;
		return undefined;
	}

	function ensureElement(): HTMLStyleElement | undefined {
		const doc = getDocument();
		if (!doc) return undefined;
		const existing = asStyleElement(doc.getElementById(id));
		if (existing) {
			if (!existing.isConnected) {
				existing.id = id;
				if (nonce) existing.nonce = nonce;
				if (media) existing.media = media;
				doc.head.appendChild(existing);
			}
			return existing;
		}
		const element = doc.createElement('style');
		element.id = id;
		if (nonce) element.nonce = nonce;
		if (media) element.media = media;
		doc.head.appendChild(element);
		return element;
	}

	function applyCss() {
		const element = asStyleElement(getDocument()?.getElementById(id) ?? null);
		if (element && isLoaded) element.textContent = resolveGetter(css);
	}

	function load() {
		const element = ensureElement();
		if (!element || isLoaded) return;
		refCounts.set(element, (refCounts.get(element) ?? 0) + 1);
		isLoaded = true;
		applyCss();
	}

	function unload() {
		const doc = getDocument();
		if (!doc || !isLoaded) return;
		isLoaded = false;
		const element = asStyleElement(doc.getElementById(id));
		if (element) {
			const count = (refCounts.get(element) ?? 1) - 1;
			if (count <= 0) {
				refCounts.delete(element);
				element.remove();
			} else {
				refCounts.set(element, count);
			}
		}
	}

	if (isBrowser) {
		$effect(() => {
			resolveGetter(css);
			if (isLoaded) applyCss();
		});
		// NOTE: load()/unload() both read and write `isLoaded`. Running
		// them tracked would ping-pong the effect with its own cleanup
		// (cleanup unloads → body reloads → …), so they run untracked: this
		// effect fires exactly once, and `isLoaded` changes propagate only
		// to the CSS effect above.
		$effect(() => {
			untrack(() => {
				if (immediate && !manual) load();
			});
			return () => {
				if (!manual) untrack(() => unload());
			};
		});
	}

	return {
		id,
		get css() {
			return resolveGetter(css);
		},
		load,
		unload,
		get isLoaded() {
			return isLoaded;
		}
	};
}
