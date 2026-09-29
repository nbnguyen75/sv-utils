# `useRefHistory`

Auto-tracked change history (undo/redo) for a state cell.
Inspired by [VueUse `useRefHistory`](https://vueuse.org/core/useRefHistory/).

## Signature

```ts
import { useRefHistory } from 'sv-utils';

const history = useRefHistory(form, { capacity: 50, clone: true });
history.undo();
history.pause();
history.batch(() => {
	form.value.a = 1;
	form.value.b = 2;
});
```

## Options

| Parameter        | Type                                 | Default    | Description                                                   |
| ---------------- | ------------------------------------ | ---------- | ------------------------------------------------------------- |
| `source`         | `{ value: Raw }`                     | (required) | Writable cell to track.                                       |
| + manual options | `capacity`, `clone`, `dump`, `parse` | —          | See `useManualRefHistory`.                                    |
| `deep`           | `boolean`                            | `false`    | Track nested mutations (deep snapshot reads).                 |
| `debounce`       | `number`                             | —          | Coalesce bursts; commit after quiet ms (not with `throttle`). |
| `throttle`       | `number`                             | —          | At most one commit per window ms (not with `debounce`).       |
| `shouldCommit`   | `(oldValue, newValue) => boolean`    | always     | Veto a commit.                                                |

## Returns

Everything from `useManualRefHistory`, plus:

| Field                                      | Type                             | Description                                         |
| ------------------------------------------ | -------------------------------- | --------------------------------------------------- |
| `isTracking`                               | `boolean` (getter)               | Whether automatic commits are enabled.              |
| `pause` / `resume`                         | methods                          | Suspend/resume; `resume(true)` commits immediately. |
| `batch`                                    | `(fn: (cancel) => void) => void` | Silenced writes + one commit (unless canceled).     |
| `dispose`                                  | `() => void`                     | Stop tracking and drop all records.                 |
| `commit`                                   | `() => void`                     | Manual commit honoring `shouldCommit`.              |
| `ignoreUpdates` / `ignorePrevAsyncUpdates` | methods                          | Silence controls (see `watchIgnorable`).            |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useRefHistory } from 'sv-utils';

	let doc = $state({ text: '' });
	const history = useRefHistory(
		{
			get value() {
				return doc;
			},
			set value(next) {
				doc = next;
			}
		},
		{ clone: true, deep: true }
	);
</script>

<button onclick={() => history.undo()} disabled={!history.canUndo}>Undo</button>
<button onclick={() => history.redo()} disabled={!history.canRedo}>Redo</button>
```

### SSR behavior

Commits attach on mount; nothing tracks on the server. Must be called in
component initialization.

## Edge cases & cleanup

- Silent writes (`ignoreUpdates`, undo/redo internals, `batch`) never
  double-commit — committing touches stacks only, never the tracked
  source.
- `deep` without `clone` tracks nested edits but cannot restore them
  (shared references); pair them for real undo.
- Unmount disposal is automatic; `dispose()` also clears records.
- Must be called in component initialization (uses `$effect`).

## Parity notes

- Same auto-tracking/pause/batch/dispose semantics; `pausableFilter` and
  `eventFilter` options are replaced by the built-in flag plus
  `debounce`/`throttle` windows.
