# `useDebouncedRefHistory`

Auto-tracked history with debounced commits.
Inspired by [VueUse `useDebouncedRefHistory`](https://vueuse.org/core/useDebouncedRefHistory/).

## Signature

```ts
import { useDebouncedRefHistory } from 'sv-utils';

const history = useDebouncedRefHistory(form, { clone: true, debounce: 300 });
```

## Options

Same as `useRefHistory`, plus:

| Parameter  | Type     | Default | Description                      |
| ---------- | -------- | ------- | -------------------------------- |
| `debounce` | `number` | `200`   | Quiet ms before a burst commits. |

## Returns

Same as `useRefHistory`.

## Examples

### Basic usage

```ts
import { useDebouncedRefHistory } from 'sv-utils';

// Typing bursts coalesce: one record per pause.
const history = useDebouncedRefHistory(editor, { clone: true, debounce: 500 });
history.undo(); // back before the burst
```

### SSR behavior

Commits attach on mount; nothing tracks on the server. Must be called in
component initialization.

## Edge cases & cleanup

- Unmount disposes a pending debounced commit (no post-unmount writes).
- See `useRefHistory` for tracking/undo semantics.

## Parity notes

- Same shorthand shape; the window rides on this library's own
  lodash-parity `useDebounceFn`.
