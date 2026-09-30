import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeElement } from '../../shared/getter/index.ts';

/** Options for {@link onElementRemoval}. */
export interface OnElementRemovalOptions {
	/**
	 * Root to observe (a document or shadow root).
	 * @default document
	 */
	document?: Document | ShadowRoot;
}

/**
 * Fire a callback when an element — or any ancestor — is removed.
 *
 * @param target Element (or getter) to watch.
 * @param callback Called with the mutation records of the removal.
 * @param options Observed root.
 * @example
 * ```ts
 * const stop = onElementRemoval(() => tooltip, () => cleanup());
 * ```
 */
export function onElementRemoval(
	target: MaybeElement,
	callback: (mutations: MutationRecord[]) => void,
	options: OnElementRemovalOptions = {}
): () => void {
	let stopped = false;
	let observer: MutationObserver | undefined;

	function disconnect() {
		observer?.disconnect();
		observer = undefined;
	}

	if (isBrowser && typeof MutationObserver !== 'undefined') {
		$effect(() => {
			if (stopped) return;
			const element = resolveGetter(target);
			disconnect();
			if (!element) return;
			const root = options.document ?? (typeof document !== 'undefined' ? document : undefined);
			if (!root) return;
			observer = new MutationObserver((mutations) => {
				if (stopped) return;
				const removed = mutations.map((mutation) => [...mutation.removedNodes]).flat();
				if (removed.some((node) => node === element || node.contains(element))) {
					callback(mutations);
				}
			});
			observer.observe(root, { childList: true, subtree: true });
			return () => disconnect();
		});
	}

	return () => {
		stopped = true;
		disconnect();
	};
}
