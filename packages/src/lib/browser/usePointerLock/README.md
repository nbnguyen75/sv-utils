# `usePointerLock`

Request and track the Pointer Lock API on an element.
Inspired by [VueUse `usePointerLock`](https://vueuse.org/core/usePointerLock/).

## Signature

```ts
import { usePointerLock } from 'sv-utils';

const { lock, unlock, element } = usePointerLock(() => canvas);
await lock(); // pointer captured by canvas
element; // canvas
await unlock();
```

## Options

`UsePointerLockOptions` is currently empty and reserved for future parity.
The first positional argument is the default lock target (element or
getter).

## Returns

| Field            | Type                                               | Reactive | Description                                                               |
| ---------------- | -------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `isSupported`    | `boolean`                                          | static   | Whether the Pointer Lock API exists here.                                 |
| `element`        | `Element \| null \| undefined`                     | getter   | Locked element (`undefined` before the first lock, `null` when unlocked). |
| `triggerElement` | `Element \| null \| undefined`                     | getter   | Element whose click started the lock.                                     |
| `lock`           | `(target?: MaybeElement \| Event) => Promise<...>` | method   | Lock; resolves with the locked element.                                   |
| `unlock`         | `() => Promise<boolean>`                           | method   | Exit; resolves `false` when nothing was locked.                           |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { usePointerLock } from 'sv-utils';

	let canvas = $state<HTMLCanvasElement | null>(null);
	const { lock, unlock, element, isSupported } = usePointerLock(() => canvas);
</script>

{#if isSupported}
	<button onclick={() => lock()}>Capture pointer</button>
	<button onclick={() => unlock()}>Release</button>
	<p>Locked: {element === canvas}</p>
{/if}
```

### Locking the clicked element

```svelte
<script lang="ts">
	import { usePointerLock } from 'sv-utils';

	const { lock, triggerElement } = usePointerLock();
</script>

<!-- the click event is passed through, so the button itself locks -->
<button onclick={(event) => lock(event)}>Click to lock me</button>
<p>Trigger: {triggerElement?.tagName}</p>
```

### SSR behavior

`isSupported` is `false` without a DOM, `lock()` rejects with
`"Pointer Lock API is not supported by your browser."`, and `unlock()`
resolves `false`. Nothing is observed or requested on the server.

## Edge cases & cleanup

- `lock()` accepts an element/getter, a click `Event` (locks
  `currentTarget`, falling back to the creation target), or nothing at
  all (locks the creation target — a small extension over VueUse, whose
  callers always pass the click event).
- `lock()` rejects `"Target element undefined."` when nothing resolves.
- Both `lock()` and `unlock()` wait on a one-shot `pointerlockchange`
  listener attached _before_ the request, so neither a synchronous nor
  an asynchronous dispatch can be missed.
- Lock and unlock failures surface as a thrown
  `"Failed to acquire/release pointer lock."` from the `pointerlockerror`
  handler, matching upstream.
- `unlock()` on an idle instance resolves `false` without touching the API.
- Both listeners dispose with the component.
- Must be called in component initialization (uses `$state` / `$effect`).

## Parity notes

- `until()` is deliberately not used internally: it creates an
  `$effect`, which is an orphan when called from post-mount methods like
  `lock()`/`unlock()`. The one-shot listener is the Svelte-safe
  equivalent.
- `element`/`triggerElement` are getter-backed rather than refs, so
  destructuring stays reactive.
