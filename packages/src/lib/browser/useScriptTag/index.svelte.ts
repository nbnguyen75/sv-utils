import type { MaybeGetter } from '../../shared/getter/index.ts';

import { untrack } from 'svelte';

import { resolveGetter } from '../../shared/getter/index.ts';
import { isBrowser, noop } from '../../shared/is.ts';

/** Options for {@link useScriptTag}. */
export interface UseScriptTagOptions {
	/** CORS mode. */
	crossOrigin?: 'anonymous' | 'use-credentials';
	/** Referrer policy. */
	referrerPolicy?: ReferrerPolicy;
	/** Extra attributes. */
	attrs?: Record<string, string>;
	/**
	 * Document receiving the tag. `null` disables.
	 * @default document
	 */
	document?: Document | null;
	/**
	 * Load on mount.
	 * @default true
	 */
	immediate?: boolean;
	/** `nomodule` attribute. */
	noModule?: boolean;
	/**
	 * Manual timing: skip auto load and auto unload.
	 * @default false
	 */
	manual?: boolean;
	/**
	 * `async` attribute.
	 * @default true
	 */
	async?: boolean;
	/** `defer` attribute. */
	defer?: boolean;
	/** Nonce for Content Security Policy. */
	nonce?: string;
	/**
	 * Script type.
	 * @default 'text/javascript'
	 */
	type?: string;
}

/** State returned by {@link useScriptTag}. */
export interface UseScriptTagReturn {
	/**
	 * Load (singleton per instance). Resolves with the element, or `false`
	 * without a document.
	 */
	load(waitForScriptLoad?: boolean): Promise<HTMLScriptElement | boolean>;
	/** The script element once known. Getter-backed. */
	readonly scriptTag: HTMLScriptElement | null;
	/** Remove the tag and forget it. */
	unload(): void;
}

/**
 * Load an external script exactly once per instance.
 *
 * @param src Script URL (or getter).
 * @param onLoaded Called with the element on load.
 * @param options Timing, attributes, document.
 * @example
 * ```ts
 * const { load } = useScriptTag('https://example.com/widget.js', () => init());
 * await load(); // resolves once loaded
 * ```
 */
export function useScriptTag(
	src: MaybeGetter<string>,
	onLoaded: (element: HTMLScriptElement) => void = noop,
	options: UseScriptTagOptions = {}
): UseScriptTagReturn {
	const {
		immediate = true,
		manual = false,
		type = 'text/javascript',
		async = true,
		crossOrigin,
		referrerPolicy,
		noModule,
		defer,
		attrs = {},
		nonce
	} = options;

	let scriptTag = $state<HTMLScriptElement | null>(null);
	let pending: Promise<HTMLScriptElement | boolean> | null = null;

	function getDocument(): Document | undefined {
		if (options.document === undefined) {
			return isBrowser && typeof document !== 'undefined' ? document : undefined;
		}
		return options.document ?? undefined;
	}

	function loadScript(waitForScriptLoad: boolean): Promise<HTMLScriptElement | boolean> {
		return new Promise<HTMLScriptElement | boolean>((resolvePromise, rejectPromise) => {
			const doc = getDocument();
			if (!doc) {
				resolvePromise(false);
				return;
			}
			const source = resolveGetter(src);

			function settle(element: HTMLScriptElement) {
				scriptTag = element;
				resolvePromise(element);
			}

			const found = doc.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
			if (found && found.hasAttribute('data-loaded')) {
				settle(found);
				return;
			}

			let element = found;
			let shouldAppend = false;
			if (!element) {
				const created = doc.createElement('script');
				created.type = type;
				created.async = async;
				created.src = source;
				if (defer) created.defer = defer;
				if (crossOrigin) created.crossOrigin = crossOrigin;
				if (noModule) created.noModule = noModule;
				if (referrerPolicy) created.referrerPolicy = referrerPolicy;
				if (nonce) created.nonce = nonce;
				for (const [name, value] of Object.entries(attrs)) created.setAttribute(name, value);
				element = created;
				shouldAppend = true;
			}

			const target = element;
			const cleanup = () => {
				target.removeEventListener('error', onError);
				target.removeEventListener('abort', onAbort);
				target.removeEventListener('load', onLoad);
			};
			const onError = (event: Event) => {
				cleanup();
				rejectPromise(event);
			};
			const onAbort = (event: Event) => {
				cleanup();
				rejectPromise(event);
			};
			const onLoad = () => {
				target.setAttribute('data-loaded', 'true');
				onLoaded(target);
				cleanup();
				settle(target);
			};
			target.addEventListener('error', onError);
			target.addEventListener('abort', onAbort);
			target.addEventListener('load', onLoad);

			if (shouldAppend) doc.head.appendChild(target);
			if (!waitForScriptLoad) {
				cleanup();
				settle(target);
			}
		});
	}

	function load(waitForScriptLoad = true): Promise<HTMLScriptElement | boolean> {
		if (!pending) pending = loadScript(waitForScriptLoad);
		return pending;
	}

	function unload() {
		pending = null;
		if (scriptTag) scriptTag = null;
		const doc = getDocument();
		if (!doc) return;
		const element = doc.querySelector<HTMLScriptElement>(`script[src="${resolveGetter(src)}"]`);
		if (element) element.remove();
	}

	if (isBrowser) {
		// NOTE: load()/unload() write `scriptTag`, so they run untracked —
		// same load/unload-flag ping-pong as useStyleTag.
		$effect(() => {
			untrack(() => {
				if (immediate && !manual) void load().catch(noop);
			});
			return () => {
				if (!manual) untrack(() => unload());
			};
		});
	}

	return {
		get scriptTag() {
			return scriptTag;
		},
		load,
		unload
	};
}
