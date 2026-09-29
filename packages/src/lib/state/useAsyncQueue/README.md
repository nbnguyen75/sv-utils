# `useAsyncQueue`

Sequential async task queue with per-task state.
Inspired by [VueUse `useAsyncQueue`](https://vueuse.org/core/useAsyncQueue/).

## Signature

```ts
import { useAsyncQueue } from 'sv-utils';

const queue = useAsyncQueue(
	[(previous: unknown) => fetchA(), (previous: unknown) => fetchB(previous)],
	{ onFinished: () => done() }
);
queue.result[0]?.state; // 'pending' | 'fulfilled' | 'rejected' | 'aborted'
```

## Options

| Parameter    | Type                                       | Default    | Description                                                   |
| ------------ | ------------------------------------------ | ---------- | ------------------------------------------------------------- |
| `tasks`      | `((previous: never) => T \| Promise<T>)[]` | (required) | Run strictly in sequence, each receiving the previous result. |
| `interrupt`  | `boolean`                                  | `true`     | Stop the chain on rejection (rest stay pending).              |
| `onError`    | `() => void`                               | —          | Called per rejection.                                         |
| `onFinished` | `() => void`                               | —          | Called when settled (done, interrupted, or aborted).          |
| `signal`     | `AbortSignal`                              | —          | Aborts the queue.                                             |

## Returns

| Field         | Type                         | Reactive | Description                          |
| ------------- | ---------------------------- | -------- | ------------------------------------ |
| `activeIndex` | `number`                     | getter   | Index of the running (or last) task. |
| `result`      | `{ state; data }[]` per task | getter   | Per-task outcomes in order.          |

## Examples

### Basic usage

```ts
import { useAsyncQueue } from 'sv-utils';

const queue = useAsyncQueue([() => login(credentials), (session) => fetchProfile(session.token)]);

// Later: queue.result[1]?.data
```

### SSR behavior

Tasks launch on creation with no DOM access — safe to create anywhere.
Each server render gets an independent queue.

## Edge cases & cleanup

- Empty task lists call `onFinished` immediately with `activeIndex: -1`.
- Rejections record `{ state: 'rejected' }` and (with `interrupt`) freeze
  the rest as pending; with `interrupt: false` the chain continues.
- A dead-on-arrival signal marks tasks aborted without running them.
- No timers or effects — nothing to dispose.

## Parity notes

- Same chaining/interrupt/abort semantics; task results type per position.
  Task callbacks type the previous result as `never` (annotate it at use).
