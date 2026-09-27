export function useClipboard(opts?: { copiedDuring?: number }) {
	const copiedDuring = opts?.copiedDuring ?? 1500;

	let copied = $state(false);
	let text = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	const isSupported = typeof navigator !== 'undefined' && !!navigator.clipboard;

	async function copy(value: string) {
		if (!isSupported) return;
		await navigator.clipboard.writeText(value);
		text = value;
		copied = true;

		if (timer) clearTimeout(timer);
		timer = setTimeout(() => (copied = false), copiedDuring);
	}

	return {
		get copied() {
			return copied;
		},
		get text() {
			return text;
		},
		isSupported,
		copy
	};
}
