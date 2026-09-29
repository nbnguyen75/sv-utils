import type { MaybeGetter } from '../../shared/getter/index.ts';

import { resolveGetter } from '../../shared/getter/index.ts';

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
	/**
	 * Flip between the truthy and falsy values, or set an explicit value
	 * when an argument is passed (even `undefined` counts as explicit).
	 * @returns The new value.
	 */
	toggle(value?: T): T;
	/** Current value. Getter/setter-backed (destructure-safe). */
	value: T;
}

/**
 * Boolean (or two-value) state with a toggler.
 * @example
 * ```ts
 * const toggle = useToggle();
 * toggle.toggle(); // true
 * toggle.value = false;
 * ```
 */

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
		initialValue === undefined ? resolveGetter(falsyValue) : resolveGetter(initialValue)
	);

	function toggle(value?: Truthy | Falsy): Truthy | Falsy {
		if (arguments.length > 0) {
			state = value as Truthy | Falsy;
			return state;
		}
		const truthy = resolveGetter(truthyValue);
		state = state === (truthy as unknown as Truthy | Falsy) ? resolveGetter(falsyValue) : truthy;
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
