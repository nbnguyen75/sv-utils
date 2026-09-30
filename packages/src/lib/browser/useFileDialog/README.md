# `useFileDialog`

Open a file dialog with ease: selection state, per-open overrides, and
change/cancel notifications.
Inspired by [VueUse `useFileDialog`](https://vueuse.org/core/useFileDialog/).

## Signature

```ts
import { useFileDialog } from 'sv-utils';

const { files, open, reset } = useFileDialog({ accept: 'image/*' });
open(); // shows the dialog
```

## Options

| Option         | Type                                                 | Default                | Description                                      |
| -------------- | ---------------------------------------------------- | ---------------------- | ------------------------------------------------ |
| `multiple`     | `MaybeGetter<boolean>`                               | `true`                 | Allow multiple files.                            |
| `accept`       | `MaybeGetter<string>`                                | `'*'`                  | Accepted MIME types or extensions.               |
| `capture`      | `MaybeGetter<string>`                                | —                      | Mobile capture source.                           |
| `reset`        | `MaybeGetter<boolean>`                               | `false`                | Clear the selection when opening.                |
| `directory`    | `MaybeGetter<boolean>`                               | `false`                | Select directories instead of files.             |
| `initialFiles` | `File[] \| FileList`                                 | `null`                 | Starting selection (arrays need `DataTransfer`). |
| `input`        | `MaybeGetter<HTMLInputElement \| null \| undefined>` | detached created input | Custom input element.                            |

`open()` accepts a `Partial<UseFileDialogOptions>` overriding any of
the above for a single shot.

## Returns

| Field        | Type                                                  | Reactive | Description                 |
| ------------ | ----------------------------------------------------- | -------- | --------------------------- |
| `files`      | `FileList \| null`                                    | getter   | Selected files.             |
| `open()`     | `(localOptions?) => void`                             | method   | Show the dialog.            |
| `reset()`    | `() => void`                                          | method   | Clear the selection.        |
| `onChange()` | `((files: FileList \| null) => unknown) => { off() }` | method   | Subscribe to selections.    |
| `onCancel()` | `(() => unknown) => { off() }`                        | method   | Subscribe to cancellations. |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useFileDialog } from 'sv-utils';

	const { files, open, reset } = useFileDialog({ accept: 'image/*' });

	$effect(() => {
		if (files) upload(Array.from(files));
	});
</script>

<button onclick={() => open()}>Pick images</button>
<button onclick={() => reset()}>Clear</button>
```

### One-shot overrides and notifications

```ts
const { open, onChange, onCancel } = useFileDialog({ multiple: false });

onChange((files) => console.log(files?.length));
onCancel(() => console.log('dismissed'));
open({ accept: 'video/*' });
```

### SSR behavior

Without a DOM no input is created: `open()` and `reset()` are safe
no-ops and `files` stays `null`.

## Edge cases & cleanup

- Options apply on mount and re-apply when reactive option getters
  change; `open()` merges defaults, construction options, and
  per-call overrides in that order.
- `reset()` clears the state and notifies with `null` only when the
  input actually held a value (matching upstream).
- Array `initialFiles` need a constructible `DataTransfer`; without
  one the initial selection stays `null`.
- The created input is detached (never inserted into the DOM).
- Nothing external is observed; disposal needs no extra cleanup.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- VueUse's `EventHookOn` subscriptions are this library's
  `createEventHook().on` — same subscribe/unsubscribe shape.
- `capture`/`webkitdirectory` are assigned only when provided, so
  default inputs stay untouched.
