export interface DebounceOptions {
	leading?: boolean;
	trailing?: boolean;
	maxWait?: number;
}

export function useDebounceFn<Args extends unknown[]>(
	fn: (...args: Args) => void,
	delay = 200,
	options: DebounceOptions = {}
) {
	const { leading = false, trailing = true, maxWait } = options;

	let timer: ReturnType<typeof setTimeout> | undefined;
	let maxTimer: ReturnType<typeof setTimeout> | undefined;
	let lastArgs: Args | undefined;

	function invoke(args: Args) {
		fn(...args);
	}

	function clearTimers() {
		if (timer) clearTimeout(timer);
		if (maxTimer) clearTimeout(maxTimer);
		timer = undefined;
		maxTimer = undefined;
	}

	function debounced(...args: Args) {
		lastArgs = args;
		const isFirstCall = !timer && !maxTimer;

		if (isFirstCall && leading) {
			invoke(args);
		}

		if (timer) clearTimeout(timer);

		timer = setTimeout(() => {
			if (trailing && !(isFirstCall && leading)) {
				invoke(lastArgs as Args);
			}
			clearTimers();
		}, delay);

		if (maxWait !== undefined && !maxTimer) {
			maxTimer = setTimeout(() => {
				if (trailing) invoke(lastArgs as Args);
				clearTimers();
			}, maxWait);
		}
	}

	debounced.cancel = () => {
		clearTimers();
		lastArgs = undefined;
	};

	debounced.flush = () => {
		if (lastArgs && (timer || maxTimer)) {
			invoke(lastArgs);
			clearTimers();
		}
	};

	return debounced;
}
