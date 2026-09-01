# Admin Data Table Migration Plan

## Objective

Convert the admin student table from manually rendered shadcn `Table` primitives to the shadcn Data Table pattern backed by TanStack Table, while preserving all existing behavior.

The shadcn Data Table is not an installable component. It is an architecture built around the existing `Table` component and `@tanstack/react-table`.

## Requirements

Preserve these behaviors:

- New Students, All Students, and Archive filters
- Updated At ascending, descending, and unsorted states
- Encoded, complete-information, and complete-photo counters
- Status mutation with optimistic updates
- Archive and unarchive actions
- Edit-student dialog
- Photo and signature downloads
- Copy-student-data action
- Add/edit admin note dialog
- Existing TRPC Suspense query and cache invalidation
- Existing admin authorization and page hydration
- Existing student ordering when no table sort is active

Do not introduce server-side pagination as part of this migration.

## Implementation Steps

### 1. Inspect the current implementation

Read these files before editing:

- `src/app/admin/table.tsx`
- `src/app/admin/student-row.tsx`
- `src/app/admin/actions-dropdown.tsx`
- `src/app/admin/page.tsx`
- `src/server/api/routers/students.ts`
- `src/components/ui/table.tsx`
- `components.json`
- `package.json`

Confirm that:

- `src/components/ui/table.tsx` is already installed.
- The project uses the `~/` import alias.
- The project uses the Radix shadcn base.
- `getStudents` currently returns the complete student collection.
- The admin table is a client component.

### 2. Consult current shadcn documentation

Run:

```bash
pnpm dlx shadcn@latest info --json
```

Consult the current Radix Data Table guide:

```text
https://ui.shadcn.com/docs/components/radix/data-table
```

Use the API shown by the currently installed TanStack version rather than relying on older v8 examples. Current shadcn documentation may use TanStack Table v9 APIs such as `useTable`, feature registration, and `<table.FlexRender />`.

### 3. Install TanStack Table

Run:

```bash
pnpm add @tanstack/react-table
```

Do not reinstall or overwrite the existing shadcn `table` component.

Verify that `package.json` and `pnpm-lock.yaml` contain the dependency.

### 4. Add the table feature configuration

Create:

```text
src/app/admin/data-table-features.ts
```

Register only the features needed by the admin view:

- Row sorting
- Column filtering
- Pagination
- Column visibility, only if controls are included in this migration

Include the corresponding sorted, filtered, and paginated row models.

Export the feature configuration and its inferred type for use by the column definitions and table component.

Avoid row selection unless a concrete bulk action will use it.

### 5. Refactor interactive row behavior into cell components

Refactor `src/app/admin/student-row.tsx`.

The current component owns an entire `<TableRow>`, which cannot be used directly by TanStack's cell-rendering architecture. Replace or supplement it with focused components such as:

- `StudentStatusCell`
- `StudentArchiveCell`
- `StudentActionsCell`

Responsibilities:

- `StudentStatusCell` owns the status mutation and optimistic cache update.
- `StudentArchiveCell` owns the archive/unarchive mutation.
- `StudentActionsCell` owns the dropdown, edit dialog, note dialog, download actions, and copy action.

Preserve the current mutation behavior and TRPC invalidation.

Ensure dialogs remain mounted correctly even though they are rendered from a table cell.

Remove the old full-row component after all callers have been migrated.

### 6. Define typed student columns

Create:

```text
src/app/admin/columns.tsx
```

Mark it as a client module if required by the APIs and cell components it uses.

Use `GetStudentsOutputType` as the row type.

Define columns for:

- LRN
- Full Name
- Grade
- Section
- Emergency Name
- Emergency Number
- Emergency Address
- Status
- Archived
- Created At
- Updated At
- Actions

Column behavior:

- Use accessors for real student fields.
- Use display columns for actions that do not represent sortable data.
- Format nullable values safely.
- Format dates with the same behavior as the current implementation.
- Make Updated At sortable.
- Disable sorting on Actions.
- Render status, archive, and menu behavior through the extracted cell components.
- Give the Actions column a stable explicit ID.

Use the project's Radix icon library for sort indicators. Do not introduce a second icon library specifically for this table.

### 7. Convert the admin table renderer

Refactor:

```text
src/app/admin/table.tsx
```

Keep it as a client component.

Replace the manually written header and body with a TanStack table instance.

Render:

- Header groups from the table instance
- Header content through the version-appropriate flex renderer
- Rows from `table.getRowModel().rows`
- Visible cells from each row
- Cell content through the version-appropriate flex renderer
- A single "No results" row when there are no rows

Use `student.id` as the stable row identity through the table's row-ID configuration.

Preserve the surrounding `Container`, counters, tabs, and `ActionsDropdown`.

### 8. Move sorting to TanStack state

Remove the custom `orderBy` state and `handleSort` implementation.

Use TanStack sorting state for Updated At.

Maintain the three-state interaction:

1. Unsorted
2. Ascending
3. Descending

When unsorted, preserve the order received from `getStudents`, which is currently descending by `createdAt`.

Make the whole Updated At header button accessible:

- Use a real `Button` or semantic `<button>`.
- Include an accessible sorting label.
- Display the appropriate sort indicator.
- Avoid a tiny icon-only hit target.

### 9. Integrate the archive tabs

Keep the existing `FilterType` values:

```ts
"new" | "all" | "archived"
```

Prefer representing this as TanStack filtering state rather than maintaining a separate filtered array.

Required semantics:

- `new`: `isArchived === false`
- `all`: no archive filter
- `archived`: `isArchived === true`

If boolean column filtering becomes unnecessarily complex with the installed TanStack API, it is acceptable to prefilter the query result before passing it to the table. Do not duplicate filtering in both places.

Reset pagination to the first page when the active tab changes.

Use the existing shadcn `Tabs` or `ToggleGroup` component if that can be done without expanding the scope. Otherwise preserve the existing buttons and behavior.

### 10. Preserve counter semantics

The counters currently operate on students visible under the selected archive tab.

Continue calculating:

- Students with complete information
- Encoded, non-archived students
- Students with both photo and signature

Sorting must not affect counts.

If global search is added, explicitly choose and document whether counters describe:

- The selected archive tab, or
- Only search-matching rows

For a behavior-preserving migration, counters should continue to describe the selected archive tab regardless of pagination.

### 11. Add client-side pagination

Enable client-side pagination because `getStudents` currently returns all students.

Add controls for:

- Previous page
- Next page
- Current page information
- Rows per page, preferably 10, 25, 50, and 100

Use existing shadcn components where available.

Do not paginate the data before calculating the counters.

Disable navigation controls when the corresponding page does not exist.

Reset to page one when filtering changes.

### 12. Add only high-value table controls

Add a Full Name or general student search input if time permits.

A useful minimum toolbar is:

- Student search
- Existing archive tabs
- Existing counters
- Existing `ActionsDropdown`
- Optional column visibility menu

Do not add row selection unless it drives an actual bulk action.

Do not hide essential action or identity columns by default.

### 13. Handle narrow screens

The table has 12 columns and should remain usable on smaller screens.

At minimum:

- Keep horizontal scrolling around the table.
- Prevent the page itself from overflowing.
- Keep the Actions column usable.
- Avoid forcing emergency-address text into extremely narrow wrapping.

Do not remove data or change desktop behavior solely to make the table fit.

### 14. Clean up the implementation

After migration:

- Remove dead `orderBy`, `handleSort`, and manual table-header code.
- Remove the old full `StudentRow` implementation if unused.
- Remove unused imports.
- Keep table-specific components under `src/app/admin`.
- Do not create a generic application-wide DataTable abstraction unless another page immediately needs it.
- Do not change TRPC endpoints or database queries as part of this task.
- Do not overwrite unrelated user changes.

### 15. Verify behavior

Format only the files changed by this migration:

```bash
pnpm exec prettier --write <changed-files>
```

Do not run repository-wide formatting as incidental cleanup.

Run the full repository verification sequence:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Existing unrelated lint warnings are not regressions. Record any pre-existing or environment-related failures separately from failures introduced by this migration.

Manually verify:

1. The admin page loads without hydration errors.
2. New Students excludes archived students.
3. All Students includes both archived and non-archived students.
4. Archive includes only archived students.
5. Updated At cycles through ascending, descending, and unsorted.
6. Pagination works after sorting and filtering.
7. Changing tabs resets pagination appropriately.
8. Status updates optimistically and remains correct after invalidation.
9. Archive and unarchive still work.
10. Edit dialog opens and saves.
11. Note dialog opens and saves.
12. Photo and signature downloads still work.
13. Copy action still writes the expected uppercase tab-separated value.
14. Empty filters display "No results."
15. Counters remain accurate and do not change merely because the user changed pages.
16. The table can be horizontally scrolled on a narrow viewport.

### 16. Report the result

The final response should include:

- Files created and modified
- Features enabled
- Whether pagination is client-side
- Any behavior intentionally left unchanged
- Results of `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`
- Any remaining warnings or manual testing gaps

## Acceptance Criteria

The task is complete when:

- The table is driven by TanStack Table.
- Column definitions are separate from the table renderer.
- All current row actions still work.
- Updated At sorting uses TanStack state.
- Archive filtering and counters preserve current semantics.
- Client-side pagination works.
- No server API or schema changes were introduced.
- Formatting, lint, TypeScript checking, and build pass, or pre-existing failures are clearly identified.
