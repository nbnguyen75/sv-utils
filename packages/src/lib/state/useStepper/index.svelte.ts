/**
 * Helpers for building multi-step wizard interfaces.
 *
 * Inspired by [VueUse `useStepper`](https://vueuse.org/core/useStepper/).
 * Pure `$state` / `$derived` logic — safe to call anywhere, including
 * during SSR (no DOM access, no effects).
 */
import type { MaybeGetter } from '../../browser/useEventListener/index.svelte.ts';

function resolve<T>(v: MaybeGetter<T>): T {
	return typeof v === 'function' ? (v as () => T)() : v;
}

/** Step names for array steps are the step values; for records, their keys. */
export type StepName<Steps> = Steps extends readonly (infer S)[]
	? S
	: Steps extends Record<string, unknown>
		? keyof Steps
		: never;

/** Stepper state returned by {@link useStepper}. */
export interface UseStepperReturn<Name, Steps, Step> {
	/** The steps definition. Getter-backed. */
	readonly steps: Steps;
	/** Ordered step names. Getter-backed. */
	readonly stepNames: Name[];
	/** Index of the current step. Getter/setter-backed. */
	index: number;
	/** Current step value. Getter-backed. */
	readonly current: Step | undefined;
	/** Next step name, or `undefined` at the last step. Getter-backed. */
	readonly next: Name | undefined;
	/** Previous step name, or `undefined` at the first step. Getter-backed. */
	readonly previous: Name | undefined;
	/** Whether the current step is the first one. Getter-backed. */
	readonly isFirst: boolean;
	/** Whether the current step is the last one. Getter-backed. */
	readonly isLast: boolean;
	/** Step at `index`, or `undefined` when out of range. */
	at(index: number): Step | undefined;
	/** Step called `step`, or `undefined` when unknown. */
	get(step: Name): Step | undefined;
	/** Go to `step` (ignores unknown names). */
	goTo(step: Name): void;
	/** Go forward unless already last. */
	goToNext(): void;
	/** Go back unless already first. */
	goToPrevious(): void;
	/** Go back to `step`, but only when currently after it. */
	goBackTo(step: Name): void;
	/** Whether `step` is the next step. */
	isNext(step: Name): boolean;
	/** Whether `step` is the previous step. */
	isPrevious(step: Name): boolean;
	/** Whether `step` is the current step. */
	isCurrent(step: Name): boolean;
	/** Whether the current step is before `step`. */
	isBefore(step: Name): boolean;
	/** Whether the current step is after `step`. */
	isAfter(step: Name): boolean;
}

export function useStepper<T extends string | number>(
	steps: MaybeGetter<T[]>,
	initialStep?: T
): UseStepperReturn<T, T[], T>;
export function useStepper<T extends Record<string, unknown>>(
	steps: MaybeGetter<T>,
	initialStep?: keyof T
): UseStepperReturn<Exclude<keyof T, symbol>, T, T[keyof T]>;
export function useStepper(
	steps: MaybeGetter<unknown[] | Record<string, unknown>>,
	initialStep?: unknown
): UseStepperReturn<unknown, unknown, unknown> {
	const readSteps = (): unknown[] | Record<string, unknown> => resolve(steps);

	const stepNames = $derived.by((): unknown[] => {
		const current = readSteps();
		return Array.isArray(current) ? [...current] : Object.keys(current);
	});

	let index = $state(Math.max(0, stepNames.indexOf(initialStep ?? stepNames[0])));

	function atStep(i: number): unknown {
		const current = readSteps();
		if (Array.isArray(current)) return current[i];
		const name = stepNames[i] as string | undefined;
		return name === undefined ? undefined : (current as Record<string, unknown>)[name];
	}

	function getStep(step: unknown): unknown {
		const i = stepNames.indexOf(step);
		return i < 0 ? undefined : atStep(i);
	}

	const current = $derived(atStep(index));
	const isFirst = $derived(index === 0);
	const isLast = $derived(index === stepNames.length - 1);
	const next = $derived(stepNames[index + 1]);
	const previous = $derived(stepNames[index - 1]);

	function goToStep(step: unknown): void {
		const i = stepNames.indexOf(step);
		if (i >= 0) index = i;
	}

	return {
		get steps() {
			return readSteps();
		},
		get stepNames() {
			return stepNames;
		},
		get index() {
			return index;
		},
		set index(nextIndex: number) {
			index = nextIndex;
		},
		get current() {
			return current;
		},
		get next() {
			return next;
		},
		get previous() {
			return previous;
		},
		get isFirst() {
			return isFirst;
		},
		get isLast() {
			return isLast;
		},
		at(i: number) {
			return atStep(i);
		},
		get(step: unknown) {
			return getStep(step);
		},
		goTo(step: unknown) {
			goToStep(step);
		},
		goToNext() {
			if (!isLast) index += 1;
		},
		goToPrevious() {
			if (!isFirst) index -= 1;
		},
		goBackTo(step: unknown) {
			const i = stepNames.indexOf(step);
			if (i >= 0 && index > i) goToStep(step);
		},
		isNext(step: unknown) {
			return stepNames.indexOf(step) === index + 1;
		},
		isPrevious(step: unknown) {
			return stepNames.indexOf(step) === index - 1;
		},
		isCurrent(step: unknown) {
			return stepNames.indexOf(step) === index;
		},
		isBefore(step: unknown) {
			return index < stepNames.indexOf(step);
		},
		isAfter(step: unknown) {
			return index > stepNames.indexOf(step);
		}
	} as UseStepperReturn<unknown, unknown, unknown>;
}
