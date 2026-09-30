import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';

/** State returned by {@link useObjectUrl}. */
export interface UseObjectUrlReturn {
	/** The live object URL. Getter-backed. */
	readonly value: string | undefined;
}

/**
 * Reactive object URL for a blob or media source. Revokes the previous
 * URL on change and on disposal.
 *
 * @param object Blob or media source (or getter); `nullish` clears the URL.
 * @example
 * ```ts
 * const url = useObjectUrl(() => file);
 * url.value; // blob:… URL, revoked automatically
 * ```
 */
export function useObjectUrl(
	object: MaybeGetter<Blob | MediaSource | null | undefined>
): UseObjectUrlReturn {
	function canCreate(): boolean {
		return isBrowser && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
	}

	let url = $state<string | undefined>(undefined);
	// Disposal mirror: the effect below must never READ `url` (reading and
	// writing the same signal inside one effect re-triggers it forever),
	// so revocation tracks the live URL in a plain variable.
	let live: string | undefined;

	function revoke(current: string | undefined) {
		if (current !== undefined && canCreate()) URL.revokeObjectURL(current);
	}

	if (isBrowser) {
		$effect(() => {
			const target = resolveGetter(object);
			if (target && canCreate()) {
				const fresh = URL.createObjectURL(target);
				live = fresh;
				url = fresh;
			} else {
				url = undefined;
			}
			return () => {
				revoke(live);
				live = undefined;
			};
		});
	}

	return {
		get value() {
			return url;
		}
	};
}
