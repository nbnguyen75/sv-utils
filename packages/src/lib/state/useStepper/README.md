# `useStepper`

Helpers for building multi-step wizard interfaces.
Inspired by [VueUse `useStepper`](https://vueuse.org/core/useStepper/).

## Signature

```ts
import { useStepper } from 'sv-utils';

const stepper = useStepper(['intro', 'form', 'done'], 'form');
stepper.goToNext();

const byKey = useStepper({ intro: 'Welcome', done: 'Thanks' });
```

## Options

| Parameter     | Type                            | Default    | Description                         |
| ------------- | ------------------------------- | ---------- | ----------------------------------- |
| `steps`       | `MaybeGetter<T[] \| Record<…>>` | (required) | Array steps or a name→value record. |
| `initialStep` | step name                       | first step | Step to start on.                   |

## Returns

| Field                                                          | Type                           | Reactive        | Description                                               |
| -------------------------------------------------------------- | ------------------------------ | --------------- | --------------------------------------------------------- |
| `steps`                                                        | definition                     | getter          | The steps as provided.                                    |
| `stepNames`                                                    | names                          | getter          | Ordered step names (values for arrays, keys for records). |
| `index`                                                        | `number`                       | getter + setter | Index of the current step.                                |
| `current`                                                      | step \| `undefined`            | getter          | Current step value.                                       |
| `next`                                                         | name \| `undefined`            | getter          | Next step name (`undefined` at the end).                  |
| `previous`                                                     | name \| `undefined`            | getter          | Previous step name (`undefined` at the start).            |
| `isFirst`                                                      | `boolean`                      | getter          | Whether the current step is the first one.                |
| `isLast`                                                       | `boolean`                      | getter          | Whether the current step is the last one.                 |
| `at`                                                           | `(index) => step \| undefined` | method          | Step at an index.                                         |
| `get`                                                          | `(step) => step \| undefined`  | method          | Step by name.                                             |
| `goTo`                                                         | `(step) => void`               | method          | Go to a step (ignores unknown names).                     |
| `goToNext`                                                     | `() => void`                   | method          | Forward unless already last.                              |
| `goToPrevious`                                                 | `() => void`                   | method          | Back unless already first.                                |
| `goBackTo`                                                     | `(step) => void`               | method          | Back to `step`, only when currently after it.             |
| `isNext` / `isPrevious` / `isCurrent` / `isBefore` / `isAfter` | `(step) => boolean`            | methods         | Positional predicates.                                    |

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useStepper } from 'sv-utils';

	const stepper = useStepper(['intro', 'form', 'done']);
</script>

<p>Step {stepper.index + 1}: {stepper.current}</p>
<button onclick={() => stepper.goToPrevious()} disabled={stepper.isFirst}>Back</button>
<button onclick={() => stepper.goToNext()} disabled={stepper.isLast}>Next</button>
```

### SSR behavior

Pure `$state` / `$derived` logic with no DOM access and no effects — safe
to create and use during SSR. Each server render gets an independent
instance.

## Edge cases & cleanup

- Unknown step names are ignored by `goTo` and yield `undefined` from
  `get`; out-of-range `at()` returns `undefined`.
- `index` is writable, so external progress (e.g. from a slider) can drive
  the wizard directly.
- No listeners, timers, or effects — nothing to dispose.

## Parity notes

- Same navigation API as VueUse with strict TypeScript overloads for array
  vs record steps (no `any`). The steps definition itself is not made
  reactive — pass a getter if it must change.
