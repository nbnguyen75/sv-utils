import type { MaybeGetter } from '../../shared/getter/index.ts';

import { isBrowser } from '../../shared/is.ts';
import { useEventListener } from '../useEventListener/index.svelte.ts';

/** State returned by {@link useDropZone}. */
export interface UseDropZoneReturn {
	/** Whether a valid drag hovers the zone. Getter-backed. */
	readonly isOverDropZone: boolean;
	/** Dropped files (`null` before the first valid drop). Getter-backed. */
	readonly files: File[] | null;
}

/** Options for {@link useDropZone}. */
export interface UseDropZoneOptions {
	/**
	 * Allowed data types, or a predicate over them. All types allowed when
	 * omitted. A type matches when it *contains* an allowed entry
	 * (e.g. `'image/png'` matches `'image'`). NOTE: a function value is
	 * always the predicate form — getters are not supported here because
	 * they are indistinguishable from predicates.
	 */
	dataTypes?: readonly string[] | ((types: readonly string[]) => boolean);
	/** Called when a drag enters the zone. */
	onEnter?: (files: File[] | null, event: DragEvent) => void;
	/** Called when a drag leaves the zone. */
	onLeave?: (files: File[] | null, event: DragEvent) => void;
	/** Called with the dropped files. */
	onDrop?: (files: File[] | null, event: DragEvent) => void;
	/** Called while a drag hovers the zone. */
	onOver?: (files: File[] | null, event: DragEvent) => void;
	/**
	 * Custom validity check over the transfer items. Takes precedence over
	 * `dataTypes` and `multiple` when provided.
	 */
	checkValidity?: (items: DataTransferItemList) => boolean;
	/**
	 * Prevent default behavior even for invalid drags.
	 * @default false
	 */
	preventDefaultForUnhandled?: boolean;
	/**
	 * Allow multiple files to be dropped.
	 * @default true
	 */
	multiple?: boolean;
}

/**
 * Track file drops on an element or document.
 *
 * @param target Drop zone element (or getter), or the document.
 * @param options Validation, callbacks, and multi-file behavior — or the
 * `onDrop` callback alone as shorthand.
 * @example
 * ```ts
 * const { files, isOverDropZone } = useDropZone(() => zone, {
 * 	dataTypes: ['image'],
 * 	onDrop: (dropped) => upload(dropped)
 * });
 * ```
 */
export function useDropZone(
	target: MaybeGetter<HTMLElement | Document | null | undefined>,
	options: UseDropZoneOptions | UseDropZoneOptions['onDrop'] = {}
): UseDropZoneReturn {
	let isOverDropZone = $state(false);
	let files = $state<File[] | null>(null);
	let counter = 0;
	let isValid = true;

	if (isBrowser) {
		const resolved = typeof options === 'function' ? { onDrop: options } : options;
		const multiple = resolved.multiple ?? true;
		const preventDefaultForUnhandled = resolved.preventDefaultForUnhandled ?? false;

		function getFiles(event: DragEvent): File[] | null {
			const list = Array.from(event.dataTransfer?.files ?? []);
			const first = list[0];
			if (list.length === 0 || !first) return null;
			return multiple ? list : [first];
		}

		function checkDataTypes(types: string[]): boolean {
			// A function value is the predicate form (never resolved as a
			// getter: the two are indistinguishable, and upstream treats
			// functions as predicates too).
			const dataTypes = resolved.dataTypes;
			if (typeof dataTypes === 'function') return dataTypes(types);
			const list = dataTypes ?? [];
			if (list.length === 0) return true;
			if (types.length === 0) return false;
			return types.every((type) => list.some((allowed) => type.includes(allowed)));
		}

		function checkValidity(items: DataTransferItemList): boolean {
			if (resolved.checkValidity) return resolved.checkValidity(items);
			const types = Array.from(items ?? []).map((item) => item.type);
			return checkDataTypes(types) && (multiple || items.length <= 1);
		}

		function isSafari(): boolean {
			return /^(?:(?!chrome|android).)*safari/i.test(navigator.userAgent) && !('chrome' in window);
		}

		function handleDragEvent(event: DragEvent, kind: 'enter' | 'over' | 'leave' | 'drop'): void {
			const items = event.dataTransfer?.items;
			isValid = (items && checkValidity(items)) ?? false;

			if (preventDefaultForUnhandled) event.preventDefault();
			if (!isSafari() && !isValid) {
				if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
				return;
			}
			event.preventDefault();
			if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';

			const currentFiles = getFiles(event);
			if (kind === 'enter') {
				counter += 1;
				isOverDropZone = true;
				resolved.onEnter?.(null, event);
			} else if (kind === 'over') {
				resolved.onOver?.(null, event);
			} else if (kind === 'leave') {
				counter -= 1;
				if (counter === 0) isOverDropZone = false;
				resolved.onLeave?.(null, event);
			} else {
				counter = 0;
				isOverDropZone = false;
				if (isValid) {
					files = currentFiles;
					resolved.onDrop?.(currentFiles, event);
				}
			}
		}

		for (const [name, kind] of [
			['dragenter', 'enter'],
			['dragover', 'over'],
			['dragleave', 'leave'],
			['drop', 'drop']
		] as const) {
			useEventListener(target, name, (event) => handleDragEvent(event as DragEvent, kind), {
				passive: false
			});
		}
	}

	return {
		get files() {
			return files;
		},
		get isOverDropZone() {
			return isOverDropZone;
		}
	};
}
