import { describe, expect, it, vi } from 'vitest';

import { createEventHook } from './index.ts';

describe('createEventHook', () => {
	it('notifies subscribers and collects results', async () => {
		const hook = createEventHook<string>();
		const order: string[] = [];
		hook.on((data) => {
			order.push(`a:${data}`);
			return 1;
		});
		hook.on((data) => {
			order.push(`b:${data}`);
			return 2;
		});
		const results = await hook.trigger('go');
		expect(order).toEqual(['a:go', 'b:go']);
		expect(results).toEqual([1, 2]);
	});

	it('unsubscribes via off and via the on() handle', async () => {
		const hook = createEventHook<number>();
		const spy = vi.fn();
		const other = vi.fn();
		hook.on(spy);
		const subscription = hook.on(other);
		subscription.off();
		await hook.trigger(1);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(other).not.toHaveBeenCalled();
		hook.off(spy);
		await hook.trigger(2);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('clear removes every subscriber', async () => {
		const hook = createEventHook();
		const spy = vi.fn();
		hook.on(spy);
		hook.clear();
		await hook.trigger();
		expect(spy).not.toHaveBeenCalled();
	});
});
