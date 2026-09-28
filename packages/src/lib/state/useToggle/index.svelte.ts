/**
 * Boolean (or two-value) state with a toggler.
 *
 * Inspired by [VueUse `useToggle`](https://vueuse.org/shared/useToggle/).
 * Pure `$state` logic — safe to call anywhere, including during SSR
 * (no DOM access, no effects).
 */
import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Options for {@link useToggle}. */
export interface UseToggleOptions<Truthy = boolean, Falsy = boolean> {
	/**
	 * Value considered "on".
	 * @default true
	 */
	truthyValue?: MaybeGetter<Truthy>;
	/**
	 * Value considered "off".
	 * @default false
	 */
	falsyValue?: MaybeGetter<Falsy>;
}

/** Toggleable state returned by {@link useToggle}. */
export interface UseToggleReturn<T> {
	/** Current value. Getter/setter-backed (destructure-safe). */
	value: T;
	/**
	 * Flip between the truthy and falsy values, or set an explicit value
	 * when an argument is passed (even `undefined` counts as explicit).
	 * @returns The new value.
	 */
	toggle(value?: T): T;
}

export function useToggle(
	initialValue?: boolean | (() => boolean),
	options?: UseToggleOptions<boolean, boolean>
): UseToggleReturn<boolean>;
export function useToggle<Truthy, Falsy>(
	initialValue?: (Truthy | Falsy) | (() => Truthy | Falsy),
	options?: UseToggleOptions<Truthy, Falsy>
): UseToggleReturn<Truthy | Falsy>;
export function useToggle<Truthy = boolean, Falsy = boolean>(
	initialValue?: MaybeGetter<Truthy | Falsy>,
	options: UseToggleOptions<Truthy, Falsy> = {}
): UseToggleReturn<Truthy | Falsy> {
	const { truthyValue = true as unknown as Truthy, falsyValue = false as unknown as Falsy } =
		options;

	let state = $state<Truthy | Falsy>(
		initialValue === undefined ? resolve(falsyValue) : resolve(initialValue)
	);

	function toggle(value?: Truthy | Falsy): Truthy | Falsy {
		if (arguments.length > 0) {
			state = value as Truthy | Falsy;
			return state;
		}
		const truthy = resolve(truthyValue);
		state = state === (truthy as unknown as Truthy | Falsy) ? resolve(falsyValue) : truthy;
		return state;
	}

	return {
		get value() {
			return state;
		},
		set value(next: Truthy | Falsy) {
			state = next;
		},
		toggle
	};
}
