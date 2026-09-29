import { timestamp } from '../../shared/is.ts';

/** Writable cell shape accepted by the history utils. */
export interface HistoryCell<T> {
	value: T;
}

/** One history point. */
export interface UseRefHistoryRecord<T> {
	snapshot: T;
	timestamp: number;
}

/** Clone function. */
export type CloneFn<T> = (source: T) => T;

/** Options for {@link useManualRefHistory}. */
export interface UseManualRefHistoryOptions<Raw, Serialized = Raw> {
	/**
	 * Maximum undo records kept (unlimited when omitted).
	 */
	capacity?: number;
	/**
	 * `true` clones via `structuredClone`; a function clones customly.
	 * @default false (snapshots share references)
	 */
	clone?: boolean | CloneFn<Raw>;
	/**
	 * Serialize a value into a record.
	 */
	dump?: (value: Raw) => Serialized;
	/**
	 * Deserialize a record back into a value.
	 */
	parse?: (snapshot: Serialized) => Raw;
	/**
	 * Write a restored value back (defaults to assigning the cell).
	 */
	setSource?: (value: Raw) => void;
}

/** History state returned by {@link useManualRefHistory}. */
export interface UseManualRefHistoryReturn<Raw, Serialized> {
	/** Tracked cell. */
	readonly source: HistoryCell<Raw>;
	/** All records, newest first. Getter-backed. */
	readonly history: UseRefHistoryRecord<Serialized>[];
	/** Latest record (may differ from source while paused). Getter-backed. */
	readonly last: UseRefHistoryRecord<Serialized>;
	/** Undo records, newest first. Getter-backed. */
	readonly undoStack: UseRefHistoryRecord<Serialized>[];
	/** Redo records, newest first. Getter-backed. */
	readonly redoStack: UseRefHistoryRecord<Serialized>[];
	/** Whether undo is possible. Getter-backed. */
	readonly canUndo: boolean;
	/** Whether redo is possible. Getter-backed. */
	readonly canRedo: boolean;
	/** Record the current value. */
	commit(): void;
	/** Restore the previous record. */
	undo(): void;
	/** Re-apply the next record. */
	redo(): void;
	/** Drop all records. */
	clear(): void;
	/** Restore the latest record into the source. */
	reset(): void;
}

function defaultDump<Raw, Serialized>(clone: boolean | CloneFn<Raw>): (value: Raw) => Serialized {
	if (typeof clone === 'function') return clone as unknown as (value: Raw) => Serialized;
	if (clone) return (value: Raw) => structuredClone(value) as unknown as Serialized;
	return (value: Raw) => value as unknown as Serialized;
}

function defaultParse<Raw, Serialized>(
	clone: boolean | CloneFn<Raw>
): (snapshot: Serialized) => Raw {
	if (typeof clone === 'function') return clone as unknown as (snapshot: Serialized) => Raw;
	if (clone) return (snapshot: Serialized) => structuredClone(snapshot) as unknown as Raw;
	return (snapshot: Serialized) => snapshot as unknown as Raw;
}

/**
 * Track a cell's history manually — you decide when to commit.
 *
 * @param source Writable cell to track.
 * @param options `capacity`, `clone`/`dump`/`parse` codecs, `setSource`.
 * @example
 * ```ts
 * const history = useManualRefHistory(form, { clone: true });
 * form.value.name = 'edited';
 * history.commit();
 * history.undo(); // name restored
 * ```
 */
export function useManualRefHistory<Raw, Serialized = Raw>(
	source: HistoryCell<Raw>,
	options: UseManualRefHistoryOptions<Raw, Serialized> = {}
): UseManualRefHistoryReturn<Raw, Serialized> {
	const {
		capacity,
		clone = false,
		dump = defaultDump<Raw, Serialized>(clone),
		parse = defaultParse<Raw, Serialized>(clone),
		setSource = (value: Raw) => {
			source.value = value;
		}
	} = options;

	function createRecord(): UseRefHistoryRecord<Serialized> {
		// Snapshot before cloning: structuredClone() cannot consume Svelte
		// state proxies (DataCloneError), so cloners always receive plain
		// data. Without `clone`, the live reference is stored (VueUse parity).
		const input = clone ? ($state.snapshot(source.value) as Raw) : source.value;
		return { snapshot: dump(input), timestamp: timestamp() };
	}

	let last = $state<UseRefHistoryRecord<Serialized>>(createRecord());
	const undoStack = $state<UseRefHistoryRecord<Serialized>[]>([]);
	const redoStack = $state<UseRefHistoryRecord<Serialized>[]>([]);

	const history = $derived([last, ...undoStack]);
	const canUndo = $derived(undoStack.length > 0);
	const canRedo = $derived(redoStack.length > 0);

	function setRecord(record: UseRefHistoryRecord<Serialized>) {
		// Records live inside $state stacks, so reading `.snapshot` yields a
		// nested state proxy — normalize back to plain data before parsing,
		// or structuredClone() throws DataCloneError on the proxy.
		const stored = (clone ? $state.snapshot(record.snapshot) : record.snapshot) as Serialized;
		setSource(parse(stored));
		last = record;
	}

	function commit() {
		undoStack.unshift(last);
		last = createRecord();
		if (capacity !== undefined && undoStack.length > capacity) {
			undoStack.splice(capacity, Number.POSITIVE_INFINITY);
		}
		if (redoStack.length > 0) redoStack.splice(0, redoStack.length);
	}

	function clear() {
		undoStack.splice(0, undoStack.length);
		redoStack.splice(0, redoStack.length);
	}

	function undo() {
		const record = undoStack.shift();
		if (record) {
			redoStack.unshift(last);
			setRecord(record);
		}
	}

	function redo() {
		const record = redoStack.shift();
		if (record) {
			undoStack.unshift(last);
			setRecord(record);
		}
	}

	function reset() {
		setRecord(last);
	}

	return {
		source,
		get history() {
			return history;
		},
		get last() {
			return last;
		},
		get undoStack() {
			return undoStack;
		},
		get redoStack() {
			return redoStack;
		},
		get canUndo() {
			return canUndo;
		},
		get canRedo() {
			return canRedo;
		},
		commit,
		undo,
		redo,
		clear,
		reset
	};
}
