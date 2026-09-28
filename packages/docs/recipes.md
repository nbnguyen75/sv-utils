# Recipes — cut, deferred, and Svelte-native patterns

This file covers everything the roadmap intentionally does **not** port as
library code. Each entry is a copy-paste pattern using `sv-utils`
primitives (or a recommended library) instead. All snippets are SSR-safe
unless noted.

Conventions: `MaybeGetter<T>` is `T | (() => T)`; `resolve` unwraps it
(`typeof v === 'function' ? v() : v`). Snippets calling `$effect` must run
in component initialization.

---

## Timing (cut: `useTimeout`, `useInterval`, `useNow`, `useTimestamp`)

Use the kept `useTimeoutFn` / `useIntervalFn` plus one line of state.

```ts
import { useIntervalFn, useTimeoutFn } from 'sv-utils';

// useTimeout equivalent: reactive flag, auto-disposed.
let ready = $state(false);
const { start } = useTimeoutFn(() => (ready = true), 500);
$effect(() => start());

// useNow / useTimestamp equivalent: ticking clock.
let now = $state(Date.now());
useIntervalFn(() => (now = Date.now()), 1000);
```

## Watchers (cut: `watchOnce`, `watchImmediate`, `watchDeep`, `watchDebounced`, `watchThrottled`, `watchPausable`, `whenever`, `watchWithFilter`)

Plain `$effect` covers the one-liners; the kept filter utils cover the rest.

```ts
import { useDebounceFn, useThrottleFn } from 'sv-utils';

// watchOnce: guard flag. watchImmediate: just read eagerly. whenever: if.
let seen = false;
$effect(() => {
	const value = source();
	if (value && !seen) {
		seen = true;
		onFirst(value);
	}
});

// watchDebounced / watchThrottled: compose the kept filters.
const debounced = useDebounceFn((value: string) => save(value), 300);
$effect(() => debounced(query()));
```

`watchDeep` needs no equivalent: `$state` proxies already track nested
reads inside `$effect`.

## Refs (cut: `refDefault`, `refDebounced`, `refThrottled`, `syncRefs`, `computedEager`)

```ts
// refDefault: nullish fallback in a derived.
const name = $derived(raw ?? 'anonymous');

// refDebounced / refThrottled: settle through the kept filters.
let draft = $state('');
let settled = $state('');
const settle = useDebounceFn((value: string) => (settled = value), 200);
$effect(() => settle(draft));

// syncRefs: fan out in one effect.
$effect(() => {
	targetA = source();
	targetB = source();
});

// computedEager: $derived IS eager on read; for push semantics use $effect.
```

## Async (cut: `useCached`)

```ts
// Gate updates behind a comparator before writing committed state.
let committed = $state(initial);
$effect(() => {
	const next = live();
	if (!equal(next, committed)) committed = next;
});
```

## Viewport (cut: `useSSRWidth`)

```ts
// One-line SSR fallback constant; upgrade to useWindowSize (feat-016)
// when live updates matter.
const width = typeof window === 'undefined' ? 1024 : window.innerWidth;
```

## Math (cut: `useMin/Max/Average/Sum/Round/Ceil/Floor/Trunc/Abs`, `useMath`, `logicAnd/Or/Not`, `useProjection`)

```ts
// All are one-line deriveds; templates already express && / || / ! natively.
const total = $derived(items.reduce((sum, item) => sum + item.price, 0));
const clampedIndex = $derived(Math.min(Math.max(index, 0), items.length - 1));
const anyFailed = $derived(results.some((result) => !result.ok));

// useProjection equivalent (see also createProjection, kept in feat-027):
const projected = $derived(((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin);
```

## Shared (cut: `isDefined`, `get`, `set`, `useToString`, `reactify`, `reactiveComputed`)

```ts
// isDefined / get / set: inline the checks.
if (value != null) console.log(value ?? 'fallback');
const text = `${count}`;

// reactify: wrap any pure function over reactive inputs.
const fullName = $derived(`${first()} ${last()}`);

// reactiveComputed: $derived already returns reactive state; for an
// object-shaped derived, derive each field or spread once per read.
```

## Dates (deferred to `date-fns`)

```bash
bun add date-fns
```

```ts
import { format, formatDistanceToNow } from 'date-fns';

// useDateFormat / useTimeAgo equivalent: format in a derived, tick for freshness.
let now = $state(Date.now());
useIntervalFn(() => (now = Date.now()), 30_000);
const label = $derived(format(timestamp, 'yyyy-MM-dd'));
const ago = $derived(formatDistanceToNow(timestamp, { addSuffix: true }));
```

`useTimeAgoIntl` maps to the platform `Intl.RelativeTimeFormat` directly;
`useTemporalNow` maps to the Temporal API docs (still stabilizing — no
wrapper until it settles).

## Drag and drop (deferred; no code in this package)

- **Simple sortable list** → `sortablejs` behind a ~15-line Svelte action
  (`Sortable.create(node, { animation: 150, onEnd })`, destroy in the
  action cleanup).
- **Complex DnD** (multi-container, sensors, keyboard, full a11y) →
  `@dnd-kit/svelte` with the **snapshot pattern** (`onDragStart` saves
  `items.slice()`, `move()` runs in `onDragOver`, `onDragEnd` restores on
  cancel) — never reorder DOM outside Svelte's reconciler.
- **Free-form dragging** → `@neodrag/svelte` (`use:draggable` action, ~2KB,
  SSR-friendly).

## Virtual lists (deferred to `@tanstack/svelte-virtual`)

```bash
bun add @tanstack/svelte-virtual
```

Windowing, overscan, dynamic measurement, and list a11y belong to the
dedicated lib; pair it with `useElementSize` (feat-017) for container
measurement.

## Files, codes, tokens (deferred; libs used directly)

```ts
// useQRCode: the qrcode package IS the one-liner; add reactivity ad hoc
// (or useAsyncState, feat-015, once it lands).
import QRCode from 'qrcode';
let qr = $state('');
$effect(() => {
	const text = sourceText();
	if (!text) {
		qr = '';
		return;
	}
	let alive = true;
	QRCode.toDataURL(text).then((url: string) => {
		if (alive) qr = url;
	});
	return () => {
		alive = false;
	};
});

// useChangeCase / useJwt: functional APIs need no wrapper.
import { camelCase } from 'change-case';
import { jwtDecode } from 'jwt-decode';
const key = $derived(camelCase(label()));
const claims = $derived(jwtDecode<Claims>(token()));
```

## Progress, cookies, focus, drawing, validation (deferred; recipes)

```ts
// useNProgress: wire nprogress to SvelteKit navigation (or any router).
import nprogress from 'nprogress';
import { afterNavigate, beforeNavigate } from '$app/navigation';
beforeNavigate(() => nprogress.start());
afterNavigate(() => nprogress.done());

// useCookies: SvelteKit owns cookies server-side; client-side, document.cookie
// (or js-cookie) plus $state is the whole pattern.

// useFocusTrap: the focus-trap lib is framework-agnostic — call it in
// $effect on mount, deactivate in the cleanup.

// useDrauu: use a Svelte whiteboard lib; useAsyncValidator: validate into
// $state (async-validator is agnostic):
import { Schema } from 'async-validator';
let formErrors = $state<unknown>(null);
$effect(() => {
	const snapshot = $state.snapshot(form());
	let alive = true;
	new Schema(descriptor).validate(snapshot).catch((errors: unknown) => {
		if (alive) formErrors = errors;
	});
	return () => {
		alive = false;
	};
});
```

## Svelte-native skips (guidance, no port)

```svelte
<!-- useTitle: -->
<svelte:head><title>{title()}</title></svelte:head>

<!-- useTransition: svelte/motion owns tweening -->
<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	const progress = tweened(0, { duration: 400, easing: cubicOut });
</script>

<!-- useAnimate: svelte/animate, svelte/transition, or raw WAAPI -->
<script lang="ts">
	$effect(() => {
		const animation = node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
		return () => animation.cancel();
	});
</script>
```

```ts
// useMounted: an $effect body IS mount — no composable needed.
$effect(() => {
	mounted = true;
	return () => (mounted = false);
});
```

## Integration adapters (feat-030, last)

`useAxios` (`peer: axios`), `useFuse` (`peer: fuse.js`), and `useIDBKeyval`
(`peer: idb-keyval`) arrive as thin ports after everything else. Until then:

```ts
// useFuse shape today: rebuild on data change, cap results.
import Fuse from 'fuse.js';
const fuse = $derived(new Fuse(items(), options()));
const results = $derived(fuse.search(query()).slice(0, limit));

// useIDBKeyval shape today: pair useStorageAsync (feat-015) with idb-keyval
// get/set as the async backend.
```
