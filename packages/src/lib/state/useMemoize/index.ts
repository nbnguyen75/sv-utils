/** Cache container for {@link useMemoize}. */
export interface UseMemoizeCache<Key, Value> {
	/** Read a cached value. */
	get(key: Key): Value | undefined;
	/** Store a value. */
	set(key: Key, value: Value): void;
	/** Test for a cached key. */
	has(key: Key): boolean;
	/** Drop one entry. */
	delete(key: Key): void;
	/** Drop all entries. */
	clear(): void;
}

/** Memoized function returned by {@link useMemoize}. */
export interface UseMemoizeReturn<Result, Args extends unknown[]> {
	/** Cached call (computes on miss). */
	(...args: Args): Result;
	/** Recompute and refresh the entry. */
	load(...args: Args): Result;
	/** Drop one entry. */
	delete(...args: Args): void;
	/** Drop all entries. */
	clear(): void;
	/** Key derivation (customizable). */
	generateKey(...args: Args): string | number;
	/** Underlying cache. */
	cache: UseMemoizeCache<unknown, Result>;
}

/** Options for {@link useMemoize}. */
export interface UseMemoizeOptions<Result, Args extends unknown[]> {
	/** Custom key derivation (default: `JSON.stringify` of arguments). */
	getKey?: (...args: Args) => string | number;
	/** Custom cache container (default: a `Map`). */
	cache?: UseMemoizeCache<unknown, Result>;
}

/**
 * Cache a function's results by its arguments.
 *
 * @param resolver Function whose results are cached.
 * @param options `getKey` derivation and `cache` container overrides.
 * @example
 * ```ts
 * const getUser = useMemoize((id: number) => fetchUser(id));
 * getUser(7); // computes once, then cached
 * ```
 */
export function useMemoize<Result, Args extends unknown[]>(
	resolver: (...args: Args) => Result,
	options: UseMemoizeOptions<Result, Args> = {}
): UseMemoizeReturn<Result, Args> {
	const cache: UseMemoizeCache<unknown, Result> = options.cache ?? new Map<unknown, Result>();

	function generateKey(...args: Args): string | number {
		return options.getKey ? options.getKey(...args) : JSON.stringify(args);
	}

	function loadData(...args: Args): Result {
		const result = resolver(...args);
		cache.set(generateKey(...args), result);
		return result;
	}

	function memoized(...args: Args): Result {
		const key = generateKey(...args);
		if (cache.has(key)) return cache.get(key) as Result;
		return loadData(...args);
	}

	memoized.load = loadData;
	memoized.delete = (...args: Args): void => {
		cache.delete(generateKey(...args));
	};
	memoized.clear = () => {
		cache.clear();
	};
	memoized.generateKey = generateKey;
	memoized.cache = cache;

	return memoized;
}
