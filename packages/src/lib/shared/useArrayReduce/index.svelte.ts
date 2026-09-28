/**
 * Reactive `Array.reduce`, with or without an initial value.
 *
 * Inspired by [VueUse `useArrayReduce`](https://vueuse.org/shared/useArrayReduce/).
 * Memoized in `$derived`. Pure logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */
import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Reducer over `(previous, current, index)`. */
export type UseArrayReducer<Previous, Current, Result> = (
	previousValue: Previous,
	currentValue: Current,
	currentIndex: number
) => Result;

/** Reduced state returned by {@link useArrayReduce}. */
export interface UseArrayReduceReturn<T> {
	/** Reduction result. Getter-backed (destructure-safe). */
	readonly value: T;
}

export function useArrayReduce<T>(
	list: MaybeGetter<readonly T[]>,
	reducer: UseArrayReducer<T, T, T>
): UseArrayReduceReturn<T>;
export function useArrayReduce<T, U>(
	list: MaybeGetter<readonly T[]>,
	reducer: UseArrayReducer<U, T, U>,
	initialValue: MaybeGetter<U>
): UseArrayReduceReturn<U>;
export function useArrayReduce<T>(
	list: MaybeGetter<readonly T[]>,
	reducer: UseArrayReducer<unknown, T, unknown>,
	initialValue?: MaybeGetter<unknown>
): UseArrayReduceReturn<unknown> {
	const reduced = $derived.by((): unknown => {
		const resolved = resolve(list);
		if (initialValue === undefined) {
			return resolved.reduce(reducer as unknown as UseArrayReducer<T, T, T>);
		}
		// A function initial value is itself a getter (mirrors VueUse);
		// omitting it keeps the native reduce throw-on-empty.
		const seed =
			typeof initialValue === 'function' ? (initialValue as () => unknown)() : initialValue;
		return resolved.reduce(reducer, seed);
	});
	return {
		get value() {
			return reduced;
		}
	};
}
