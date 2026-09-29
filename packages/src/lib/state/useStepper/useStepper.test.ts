import { describe, expect, it } from 'vitest';

import { useStepper } from './index.ts';

describe('useStepper array steps', () => {
	it('starts at the initial step with correct neighbors', () => {
		const stepper = useStepper(['a', 'b', 'c'], 'b');
		expect(stepper.index).toBe(1);
		expect(stepper.current).toBe('b');
		expect(stepper.next).toBe('c');
		expect(stepper.previous).toBe('a');
		expect(stepper.isFirst).toBe(false);
		expect(stepper.isLast).toBe(false);
		expect(stepper.stepNames).toEqual(['a', 'b', 'c']);
	});

	it('defaults to the first step', () => {
		const stepper = useStepper(['a', 'b']);
		expect(stepper.index).toBe(0);
		expect(stepper.current).toBe('a');
		expect(stepper.isFirst).toBe(true);
		expect(stepper.previous).toBeUndefined();
	});

	it('navigates with clamping at the ends', () => {
		const stepper = useStepper(['a', 'b', 'c']);
		stepper.goToNext();
		stepper.goToNext();
		expect(stepper.current).toBe('c');
		expect(stepper.isLast).toBe(true);
		expect(stepper.next).toBeUndefined();
		stepper.goToNext();
		expect(stepper.current).toBe('c');
		stepper.goToPrevious();
		expect(stepper.current).toBe('b');
		stepper.goTo('a');
		stepper.goToPrevious();
		expect(stepper.current).toBe('a');
	});

	it('ignores unknown steps in goTo/get', () => {
		const stepper = useStepper<string>(['a', 'b']);
		stepper.goTo('zzz');
		expect(stepper.current).toBe('a');
		expect(stepper.get('zzz')).toBeUndefined();
		expect(stepper.at(7)).toBeUndefined();
		expect(stepper.at(-1)).toBeUndefined();
	});

	it('goBackTo only moves backward', () => {
		const stepper = useStepper(['a', 'b', 'c'], 'c');
		stepper.goBackTo('a');
		expect(stepper.current).toBe('a');
		stepper.goBackTo('c');
		expect(stepper.current).toBe('a');
	});

	it('evaluates step predicates', () => {
		const stepper = useStepper(['a', 'b', 'c'], 'b');
		expect(stepper.isCurrent('b')).toBe(true);
		expect(stepper.isNext('c')).toBe(true);
		expect(stepper.isPrevious('a')).toBe(true);
		expect(stepper.isBefore('c')).toBe(true);
		expect(stepper.isAfter('a')).toBe(true);
		expect(stepper.isNext('a')).toBe(false);
	});

	it('writes through the index setter', () => {
		const stepper = useStepper(['a', 'b', 'c']);
		stepper.index = 2;
		expect(stepper.current).toBe('c');
		expect(stepper.isLast).toBe(true);
	});
});

describe('useStepper record steps', () => {
	it('navigates record values by key', () => {
		const stepper = useStepper({ intro: 'Welcome', form: 'Fill in', done: 'Thanks' }, 'form');
		expect(stepper.stepNames).toEqual(['intro', 'form', 'done']);
		expect(stepper.current).toBe('Fill in');
		expect(stepper.get('done')).toBe('Thanks');
		stepper.goToNext();
		expect(stepper.current).toBe('Thanks');
		expect(stepper.isLast).toBe(true);
		expect(stepper.at(0)).toBe('Welcome');
	});
});
