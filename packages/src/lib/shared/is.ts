/**
 * Environment flags and type guards.
 *
 * Inspired by VueUse `shared/utils/is`, adapted to
 * strict TypeScript (no `any`): predicates take `unknown`, `assert` takes
 * `unknown[]`, and `hasOwn` avoids `Object.hasOwn` (ES2022) in favor of
 * `Object.prototype.hasOwnProperty` for wider lib targets.
 *
 * All flags are computed once at module import and frozen — `isIOS`, for
 * example, cannot react to a UA change afterwards. Every access is
 * `typeof`-guarded, so importing this module is safe during SSR.
 */

/** True when both `window` and `document` exist (real browser DOM). */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/** VueUse `isClient`: same condition as `isBrowser`. Kept as an alias for parity. */
export const isClient = isBrowser;

// Minimum worker-scope shape: the real global only exists inside workers,
// and this lib target does not include worker types.
declare const WorkerGlobalScope: new () => object | undefined;

/** True inside a Web Worker global scope. */
export const isWorker =
	typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope;

/**
 * True when `value` is not `undefined` (note: `null` counts as defined,
 * matching VueUse).
 */
export function isDef<T>(value: T | undefined): value is T {
	return typeof value !== 'undefined';
}

/** True when `value` is neither `null` nor `undefined`. */
export function notNullish<T>(value: T | null | undefined): value is T {
	return value != null;
}

/** `console.warn` with `infos` unless `condition` holds. */
export function assert(condition: boolean, ...infos: unknown[]): void {
	if (!condition) console.warn(...infos);
}

const objectToString = Object.prototype.toString;

/** True for plain objects (`[object Object]`); false for arrays, dates, functions, etc. */
export function isObject(value: unknown): value is Record<string, unknown> {
	return objectToString.call(value) === '[object Object]';
}

/** Current epoch milliseconds. */
export const now = (): number => Date.now();

/** Current epoch milliseconds as a unary-plus number (identical to `now()`; kept for VueUse parity). */
export const timestamp = (): number => +Date.now();

/** Clamp `n` into the inclusive `[min, max]` range. */
export const clamp = (n: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, n));

/** No-operation placeholder. */
export function noop(): void {}

/** Random integer in the inclusive `[min, max]` range. */
export const rand = (min: number, max: number): number => {
	const low = Math.ceil(min);
	const high = Math.floor(max);
	return Math.floor(Math.random() * (high - low + 1)) + low;
};

/** True when `key` is an own (non-inherited) property of `value`. */
export function hasOwn<T extends object>(value: T, key: PropertyKey): key is keyof T {
	return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * True on iOS devices (iPhone/iPad/iPod, incl. desktop-mode iPad).
 * Frozen at import time; always `false` during SSR.
 */
export const isIOS: boolean = detectIOS();

function detectIOS(): boolean {
	if (!isClient) return false;
	const userAgent = window.navigator?.userAgent ?? '';
	return (
		/iP(?:ad|hone|od)/.test(userAgent) ||
		// The new iPad Pro Gen3 identifies as Macintosh; multitouch betrays it.
		// https://github.com/vueuse/vueuse/issues/3577
		((window.navigator?.maxTouchPoints ?? 0) > 2 && /iPad|Macintosh/.test(userAgent))
	);
}
