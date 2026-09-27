export interface ThrottleOptions {
	leading?: boolean;
	trailing?: boolean;
}

export function useThrottleFn<Args extends unknown[]>(
	fn: (...args: Args) => void,
	interval = 200,
	options: ThrottleOptions = {}
) {
	const { leading = true, trailing = true } = options;

	let lastInvokeTime = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastArgs: Args | undefined;

	function invoke(args: Args) {
		lastInvokeTime = Date.now();
		fn(...args);
	}

	function throttled(...args: Args) {
		const now = Date.now();
		lastArgs = args;

		if (lastInvokeTime === 0 && !leading) {
			lastInvokeTime = now;
		}

		const remaining = interval - (now - lastInvokeTime);

		if (remaining <= 0) {
			if (timer) {
				clearTimeout(timer);
				timer = undefined;
			}
			invoke(args);
		} else if (!timer && trailing) {
			timer = setTimeout(() => {
				invoke(lastArgs as Args);
				timer = undefined;
			}, remaining);
		}
	}

	throttled.cancel = () => {
		if (timer) clearTimeout(timer);
		timer = undefined;
		lastInvokeTime = 0;
	};

	return throttled;
}
