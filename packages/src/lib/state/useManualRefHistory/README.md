# `useManualRefHistory`

Manual change history (undo/redo) for a state cell.
Inspired by [VueUse `useManualRefHistory`](https://vueuse.org/core/useManualRefHistory/).

## Signature

```ts
import { useManualRefHistory } from 'sv-utils';

const history = useManualRefHistory(source, { capacity: 50, clone: true });
source.value = 'edit';
history.commit();
history.undo();
```

## Options

| Parameter   | Type                                | Default              | Description                                                    |
| ----------- | ----------------------------------- | -------------------- | -------------------------------------------------------------- |
| `source`    | `{ value: Raw }`                    | (required)           | Writable cell to track (any getter/setter pair).               |
| `capacity`  | `number`                            | —                    | Maximum undo records kept (unlimited when omitted).            |
| `clone`     | `boolean \| ((source: Raw) => Raw)` | `false`              | `true` clones via `structuredClone`; functions clone customly. |
| `dump`      | `(value: Raw) => Serialized`        | clone-aware identity | Serialize into records.                                        |
| `parse`     | `(snapshot: Serialized) => Raw`     | clone-aware identity | Deserialize back.                                              |
| `setSource` | `(value: Raw) => void`              | assign cell          | Custom restore writer.                                         |

## Returns

| Field                                          | Type                  | Reactive | Description                                   |
| ---------------------------------------------- | --------------------- | -------- | --------------------------------------------- |
| `source`                                       | cell                  | —        | The tracked cell.                             |
| `history`                                      | records, newest first | getter   | All records.                                  |
| `last`                                         | record                | getter   | Latest record.                                |
| `undoStack`                                    | records               | getter   | Undo records, newest first.                   |
| `redoStack`                                    | records               | getter   | Redo records, newest first.                   |
| `canUndo` / `canRedo`                          | `boolean`             | getter   | Stack emptiness.                              |
| `commit` / `undo` / `redo` / `clear` / `reset` | methods               | —        | History operations (`reset` restores `last`). |

Records are `{ snapshot, timestamp }`.

## Examples

### Basic usage

```ts
import { useManualRefHistory } from 'sv-utils';

const history = useManualRefHistory(form, { clone: true });

form.value.name = 'ada';
history.commit();
history.undo(); // name restored
```

### SSR behavior

No effects — safe to create anywhere, including SSR. Each render gets an
independent history.

## Edge cases & cleanup

- Without `clone`, snapshots share references: later mutations leak into
  old records (VueUse parity — pass `clone: true` for value isolation).
- Cloners receive plain snapshots (never Svelte proxies, which
  `structuredClone` rejects).
- New commits clear the redo stack; `capacity` trims the oldest undo.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Same stacks/operations/codecs; cells replace Vue refs; `clone: true`
  means `structuredClone` (superset of VueUse's JSON default).
