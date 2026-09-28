# `useOffsetPagination`

Offset-based pagination state with clamped page navigation.
Inspired by [VueUse `useOffsetPagination`](https://vueuse.org/core/useOffsetPagination/).

## Signature

```ts
import { useOffsetPagination } from 'sv-utils';

const pages = useOffsetPagination({
	total: 95,
	pageSize: 10,
	onPageChange: (state) => fetchPage(state.currentPage)
});
pages.next();
```

## Options

| Parameter           | Type                  | Default | Description                                 |
| ------------------- | --------------------- | ------- | ------------------------------------------- |
| `total`             | `MaybeGetter<number>` | —       | Total items; omit for an unbounded listing. |
| `pageSize`          | `MaybeGetter<number>` | `10`    | Items per page (clamped to `>= 1`).         |
| `page`              | `MaybeGetter<number>` | `1`     | Initial page (clamped to `[1, pageCount]`). |
| `onPageChange`      | `(state) => void`     | —       | Called whenever the page changes.           |
| `onPageSizeChange`  | `(state) => void`     | —       | Called whenever the page size changes.      |
| `onPageCountChange` | `(state) => void`     | —       | Called whenever the page count changes.     |

## Returns

| Field             | Type         | Reactive        | Description                                |
| ----------------- | ------------ | --------------- | ------------------------------------------ |
| `currentPage`     | `number`     | getter + setter | Current page, clamped to `[1, pageCount]`. |
| `currentPageSize` | `number`     | getter + setter | Current page size, clamped to `>= 1`.      |
| `pageCount`       | `number`     | getter          | Total pages (`Infinity` when unbounded).   |
| `isFirstPage`     | `boolean`    | getter          | Whether the current page is the first one. |
| `isLastPage`      | `boolean`    | getter          | Whether the current page is the last one.  |
| `prev`            | `() => void` | method          | Back one page (clamped).                   |
| `next`            | `() => void` | method          | Forward one page (clamped).                |

Without `total`, the `isLastPage` field is omitted from the type.

## Examples

### Basic usage

```svelte
<script lang="ts">
	import { useOffsetPagination } from 'sv-utils';

	const pages = useOffsetPagination({ total: () => results.total });
</script>

<button onclick={() => pages.prev()} disabled={pages.isFirstPage}>Prev</button>
<span>{pages.currentPage} / {pages.pageCount}</span>
<button onclick={() => pages.next()} disabled={pages.isLastPage}>Next</button>
```

### SSR behavior

Initializes and clamps without DOM access; safe during SSR. Callbacks are
quiet on construction and only fire for genuine changes after mount.

## Edge cases & cleanup

- Clamped writes (e.g. `prev()` on page 1) change nothing and fire no callback.
- Shrinking the page size re-clamps the page into the new count.
- The change-callback effects dispose with the component. Component context
  is only required when callbacks are provided; pure navigation works anywhere.
- Must be called in component initialization when using callbacks
  (uses `$effect` for those).

## Parity notes

- External two-way ref sync (VueUse's `syncRef` of `page`/`pageSize` refs)
  is unsupported — drive external state from the callbacks instead.
  Otherwise page math, clamping, and callback timing match.
