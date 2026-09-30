import { isBrowser } from '../../shared/is.ts';
import { resolveGetter } from '../../shared/getter/index.ts';
import type { MaybeGetter } from '../../shared/getter/index.ts';
import { createEventHook } from '../../state/createEventHook/index.ts';

/** Options for {@link useFileDialog}. */
export interface UseFileDialogOptions {
	/**
	 * Allow multiple files.
	 * @default true
	 */
	multiple?: MaybeGetter<boolean>;
	/**
	 * Accepted MIME types or extensions.
	 * @default '*'
	 */
	accept?: MaybeGetter<string>;
	/**
	 * Capture source for mobile file inputs
	 * (`camera`, `camcorder`, `microphone`, `filesystem`).
	 */
	capture?: MaybeGetter<string>;
	/**
	 * Clear the selection when opening.
	 * @default false
	 */
	reset?: MaybeGetter<boolean>;
	/**
	 * Select directories instead of files.
	 * @default false
	 */
	directory?: MaybeGetter<boolean>;
	/**
	 * Initial files. Arrays need `DataTransfer` support.
	 * @default null
	 */
	initialFiles?: File[] | FileList;
	/**
	 * Custom input element. Defaults to a detached created input.
	 */
	input?: MaybeGetter<HTMLInputElement | null | undefined>;
}

/** State returned by {@link useFileDialog}. */
export interface UseFileDialogReturn {
	/** Selected files. Getter-backed. */
	readonly files: FileList | null;
	/** Open the dialog, optionally overriding options for one shot. */
	open(localOptions?: Partial<UseFileDialogOptions>): void;
	/** Clear the selection. */
	reset(): void;
	/** Subscribe to selections. */
	onChange(fn: (files: FileList | null) => unknown): {
		off(): void;
	};
	/** Subscribe to cancellations. */
	onCancel(fn: () => unknown): {
		off(): void;
	};
}

const DEFAULT_OPTIONS = {
	multiple: true,
	accept: '*',
	reset: false,
	directory: false
} as const;

function prepareInitialFiles(files: File[] | FileList | undefined): FileList | null {
	if (!files) return null;
	if (typeof FileList !== 'undefined' && files instanceof FileList) return files;
	if (typeof DataTransfer === 'function') {
		try {
			const transfer = new DataTransfer();
			for (const file of files) transfer.items.add(file);
			return transfer.files;
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Open a file dialog with ease.
 *
 * @param options Selection behavior, filters, custom input.
 * @example
 * ```ts
 * const { files, open, reset } = useFileDialog({ accept: 'image/*' });
 * open(); // shows the dialog
 * files; // selected FileList
 * ```
 */
export function useFileDialog(options: UseFileDialogOptions = {}): UseFileDialogReturn {
	function getDocument(): Document | undefined {
		return isBrowser && typeof document !== 'undefined' ? document : undefined;
	}

	let files = $state<FileList | null>(prepareInitialFiles(options.initialFiles));
	const changeHook = createEventHook<FileList | null>();
	const cancelHook = createEventHook();
	let cachedInput: HTMLInputElement | undefined;

	function bindInput(input: HTMLInputElement) {
		input.type = 'file';
		input.onchange = (event: Event) => {
			const result = event.target as HTMLInputElement;
			files = result.files;
			void changeHook.trigger(files);
		};
		input.oncancel = () => {
			void cancelHook.trigger();
		};
	}

	function getInput(): HTMLInputElement | undefined {
		const custom = resolveGetter(options.input ?? null);
		if (custom) {
			bindInput(custom);
			return custom;
		}
		if (!cachedInput) {
			const doc = getDocument();
			if (!doc) return undefined;
			cachedInput = doc.createElement('input');
			bindInput(cachedInput);
		}
		return cachedInput;
	}

	function reset() {
		files = null;
		const input = getInput();
		if (input && input.value) {
			input.value = '';
			void changeHook.trigger(null);
		}
	}

	function applyOptions(source: UseFileDialogOptions) {
		const element = getInput();
		if (!element) return;
		const multiple = resolveGetter(source.multiple);
		if (multiple !== undefined) element.multiple = multiple;
		const accept = resolveGetter(source.accept);
		if (accept !== undefined) element.accept = accept;
		const directory = resolveGetter(source.directory);
		if (directory !== undefined) element.webkitdirectory = directory;
		const capture = resolveGetter(source.capture);
		if (capture !== undefined) element.capture = capture;
	}

	function open(localOptions: Partial<UseFileDialogOptions> = {}) {
		const element = getInput();
		if (!element) return;
		applyOptions({ ...DEFAULT_OPTIONS, ...options, ...localOptions });
		if (resolveGetter(localOptions.reset ?? options.reset ?? false)) reset();
		element.click();
	}

	if (isBrowser) {
		// Re-apply when reactive options change. Writes DOM only, so no
		// read/write aliasing concern.
		$effect(() => {
			applyOptions(options);
		});
	}

	return {
		get files() {
			return files;
		},
		open,
		reset,
		onChange: changeHook.on,
		onCancel: cancelHook.on
	};
}
