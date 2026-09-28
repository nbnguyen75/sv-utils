/**
 * Reactive `Array.join`.
 *
 * Inspired by [VueUse `useArrayJoin`](https://vueuse.org/shared/useArrayJoin/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */
import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Joined state returned by {@link useArrayJoin}. */
export interface UseArrayJoinReturn {
	/** Joined string (`''` for empty lists). Getter-backed (destructure-safe). */
	readonly value: string;
}

/**
 * Reactive `Array.join`.
 *
 * @param list Array, or a getter over reactive state.
 * @param separator Pair separator; getters resolve per evaluation.
 *   Omitted means `','`, matching native `join`.
 */
export function useArrayJoin(
	list: MaybeGetter<readonly unknown[]>,
	separator?: MaybeGetter<string>
): UseArrayJoinReturn {
	const joined = $derived(
		resolve(list).join(separator === undefined ? undefined : resolve(separator))
	);

	return {
		get value() {
			return joined;
		}
	};
}
