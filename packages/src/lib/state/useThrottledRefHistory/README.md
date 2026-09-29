# `useThrottledRefHistory`

Auto-tracked history with throttled commits.
Inspired by [VueUse `useThrottledRefHistory`](https://vueuse.org/core/useThrottledRefHistory/).

## Signature

```ts
import { useThrottledRefHistory } from 'sv-utils';

const history = useThrottledRefHistory(form, { clone: true, throttle: 300 });
```

## Options

Same as `useRefHistory`, plus:

| Parameter  | Type     | Default | Description                 |
| ---------- | -------- | ------- | --------------------------- |
| `throttle` | `number` | `200`   | Minimum ms between commits. |

## Returns

Same as `useRefHistory`.

## Examples

### Basic usage

```ts
import { useThrottledRefHistory } from 'sv-utils';

// Slider drags commit at most 4x/second with the latest value.
const history = useThrottledRefHistory(position, { throttle: 250 });
```

### SSR behavior

Commits attach on mount; nothing tracks on the server. Must be called in
component initialization.

## Edge cases & cleanup

- The trailing edge carries the latest value; unmount disposes a pending
  trailing commit.
- See `useRefHistory` for tracking/undo semantics.

## Parity notes

- Same shorthand shape; the window rides on this library's own
  lodash-parity `useThrottleFn`.
