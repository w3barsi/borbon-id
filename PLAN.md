# Bulk Selection and Actions Plan

## Goal

Separate bulk targeting from bulk operations in the admin student table:

1. An admin first selects rows, either with the existing checkboxes or with a selection preset.
2. A separate control performs copy, download, status changes, or archiving on only those selected rows.
3. The Not Printed, Ready to Print, Complete, and Missing Signature menus no longer duplicate every operation. They only select the matching rows in the current table view.

## Intended UX

- Replace the current `Bulk Actions` hierarchy with two adjacent controls in the table toolbar:
  - `Select` contains selection presets.
  - `Actions` contains operations for the current selection.
- Keep row and header checkboxes as another way to build the same selection.
- Show the number of selected students in or beside `Actions`, for example `Actions (12)`.
- Disable `Actions` when no students are selected.
- Add a visible `Clear selection` command.
- Selection presets replace the previous selection rather than adding to it. This makes every preset deterministic and prevents an old hidden selection from being acted on accidentally.
- Presets use the table's currently filtered row model, so the active New/All/Archive tab and name search both constrain what is selected. Sorting only changes order, not membership.
- Include these presets:
  - `All visible`: every row in the current filtered table view.
  - `Not Printed`: visible rows whose status is `not_printed`.
  - `Ready to Print`: visible rows that are `not_printed` and have a non-empty LRN, picture, and signature. Preserve the existing definition.
  - `Complete`: visible rows with all required student details, picture, and signature. Preserve the existing definition and do not constrain it by status.
  - `Missing Signature`: visible rows with all required textual student information but no signature. Required information means LRN, full name, grade, section, emergency name, emergency number, and emergency address. Picture and status do not affect membership.
  - `Encoded`: visible rows whose status is `encoded`. This replaces the direct `Mark Encoded as Printed` shortcut without bypassing the selection step.
- The selected-row actions are:
  - `Copy data`
  - `Download pictures`
  - `Download signatures`
  - `Mark as Not Printed`
  - `Mark as Printed`
  - `Mark as Encoded`
- `Archive selected`
- Copy and download actions leave the selection intact so another operation can be performed on the same rows.
- A successful status change or archive operation clears the selection after invalidating student data. A failed mutation keeps the selection so the admin can retry.
- Changing the New/All/Archive tab clears selection. Searching and sorting preserve it; the selected count makes any selection that becomes hidden by search explicit.
- Standardize the selected bulk copy output on the existing compact-LRN bulk format (`compactLrn: true`) so action output does not depend on which preset created the selection.

## Implementation Steps

### 1. Centralize Cohort Predicates

Update `src/app/admin/actions-dropdown.tsx` (or rename it to `bulk-controls.tsx` and update its import) so each cohort is defined once rather than repeated across handlers.

- Add small predicates for complete textual information, Ready to Print, Complete, and Missing Signature.
- Build Complete and Missing Signature from the shared complete-information predicate so their required field definitions cannot drift apart. Complete additionally requires picture and signature; Missing Signature requires `signature === null` and does not require a picture.
- Keep Not Printed and Encoded as direct status predicates.
- Apply these predicates only to the rows supplied from the table's filtered row model.
- Do not change server status values or database schema; Ready to Print and Complete remain derived cohorts, not persisted statuses.

### 2. Make Selection Presets Drive Table State

Update `src/app/admin/table.tsx` to expose the controlled `rowSelection` state to the bulk controls.

- Build `visibleStudents` from `table.getRowModel().rows.map((row) => row.original)` after table creation. This includes the archive and search filters.
- Add a preset-selection callback that receives matching students and replaces `rowSelection` with an object keyed by `String(student.id)` and valued `true`.
- Use IDs, not row indexes, to preserve selection through sorting and data refreshes. The table already has the correct `getRowId: (student) => String(student.id)` configuration.
- Derive `selectedStudents` from the current `students` query and `rowSelection` IDs. Do not rely only on visible row objects, because a search can temporarily hide an already selected row.
- Drop selected IDs that no longer exist when query data changes, preventing stale selection after deletion or realtime updates.
- Clear `rowSelection` inside the New/All/Archive tab change handlers before applying the new archive filter.
- Pass `visibleStudents`, `selectedStudents`, the preset-selection callback, and a clear-selection callback to the new controls.

### 3. Replace the Duplicated Dropdown with Selection Controls

Refactor `src/app/admin/actions-dropdown.tsx` into a compact selection control.

- Render one `Select` dropdown with the presets listed above and their matching visible-row counts.
- Selecting a preset must only update row selection. It must not copy, download, or mutate student status.
- Disable a preset when it has zero matching visible rows.
- Include `Clear selection`, disabled when the selection is empty.
- Remove the nested Copy, Downloads, and Mark as groups from All, Not Printed, Ready to Print, and Complete.
- Remove the direct `Mark Encoded as Printed` mutation command.
- Keep naming explicit: use `All visible`, not `All`, to communicate filter scope.

### 4. Add Selected-Row Action Controls

In the same bulk-controls file, add a sibling `Actions` dropdown that accepts `selectedStudents` and an `onStatusChangeSuccess` callback.

- Display the selected count on the trigger.
- Disable the trigger if `selectedStudents.length === 0`.
- Reuse one generic copy handler, one pictures handler, one signatures handler, one status handler, and one archive handler. Do not recreate handlers per cohort.
- Keep the existing tab-separated uppercase copy row format and use compact LRNs for every selected bulk copy.
- Keep the existing ZIP naming and file suffix behavior:
  - `pictures.zip` with `PIC`
  - `signatures.zip` with `SIG`
- Disable `Download pictures` when none of the selected students has a picture and usable full name.
- Disable `Download signatures` when none of the selected students has a signature and usable full name.
- Continue wrapping ZIP creation in `toast.promise` and retain success/error feedback.
- Keep all three status targets available, but disable a target when a mutation is pending or every selected student already has that status.
- Call the existing `api.student.setStatuses` mutation with exactly the selected numeric IDs.
- On mutation success, invalidate `student.getStudents`, show the selected-count success toast, and clear selection.
- On mutation failure, show the current error toast and do not clear selection.
- Add `Archive selected` as a distinct action, separated visually from copy, download, and status actions.
- Disable `Archive selected` while its mutation is pending or when every selected student is already archived.
- Archive only the selected numeric IDs. Use an idempotent bulk endpoint that explicitly sets `isArchived` to `true`; do not call the existing single-row toggle once per student.
- On archive success, invalidate `student.getStudents`, report how many selected students were archived, and clear selection. The rows should then disappear from New Students and remain visible in All Students and Archive according to the existing filters.
- On archive failure, show an error toast and preserve the selection for retry.

### 5. Preserve Existing Checkbox Behavior

Review `src/app/admin/columns.tsx`; no structural rewrite should be necessary.

- Confirm preset-created selections appear in the row checkboxes and selected row styling.
- Keep stable ID selection and Shift-range behavior.
- Keep the header checkbox scoped to the table row model. If the table API's `toggleAllRowsSelected` includes filtered-out rows in this installed version, switch the header to the filtered/page-specific selection API or explicitly select `table.getRowModel().rows` so its behavior matches `All visible`.
- Ensure the header checkbox's checked and indeterminate states describe the same filtered scope that it toggles.

### 6. Extend the Backend Without Changing Authorization or Realtime Behavior

Update `src/server/api/routers/students.ts` with one bulk archive mutation.

- Continue using the existing admin-authorized `student.setStatuses` mutation.
- Preserve its `ids: z.array(z.number()).min(1)` validation.
- Add an `adminProcedure` such as `archiveStudents` with `ids: z.array(z.number()).min(1)` input.
- Perform one database update using `inArray(students.id, input.ids)` and set `isArchived: true` explicitly. Do not implement bulk archiving as repeated calls to the existing toggle mutation.
- Call `publishStudentsChanged()` once after the bulk archive database update, just as the existing student writes do.
- Preserve `publishStudentsChanged()` after bulk status updates.
- Do not move authorization into UI-only checks.

### 7. Remove Dead Duplication and Check Responsive Layout

- Delete obsolete cohort-specific copy/download handlers, ID arrays, and nested dropdown imports.
- Keep shared helpers such as row formatting, ZIP creation, photo extraction, and signature extraction.
- Update the toolbar in `src/app/admin/table.tsx` so search, View, badges, Select, and Actions wrap cleanly on narrow screens instead of overflowing.
- Preserve the current visual language and existing shadcn/Radix components; this is a workflow refactor, not a redesign.

## Verification

### Manual Scenarios

1. On New Students, choose Not Printed and verify only visible `not_printed` rows become checked; no operation runs.
2. Apply a name search, choose All visible, and verify only search results are selected.
3. Choose Ready to Print and verify every selected row is not printed and has LRN, picture, and signature.
4. Choose Complete and verify every selected row has all required details, picture, and signature regardless of status.
5. Choose Missing Signature and verify every selected row has all required textual information and no signature; verify rows qualify whether or not they have a picture and regardless of status.
6. Choose Encoded, then Actions > Mark as Printed; verify only those selected students change and selection clears after success.
7. Manually select a mixed set of rows and verify copy output contains exactly those rows in table/query order with compact LRNs.
8. Manually select rows, change search so one is hidden, and verify the Actions count still includes it and the operation includes it.
9. Change between New Students, All Students, and Archive and verify selection clears.
10. Download pictures/signatures from a mixed selection and verify only available files are included and filenames retain the existing suffixes.
11. Force or simulate a failed status mutation and verify the error toast appears and selection remains.
12. Select several active students, choose Archive selected, and verify only those students are archived, the selection clears, and the rows move out of New Students into Archive.
13. Select a mixture containing already archived students in All Students and verify Archive selected is idempotent and does not unarchive any row.
14. Force or simulate a failed archive mutation and verify the error toast appears and selection remains.
15. Verify header select-all and All visible have identical filtered scope and correct indeterminate behavior.
16. Verify the toolbar and both dropdowns are usable on desktop and mobile widths.

### Automated Project Checks

Run these after formatting the touched files:

```sh
pnpm exec prettier --write src/app/admin/table.tsx src/app/admin/actions-dropdown.tsx src/app/admin/columns.tsx
pnpm lint
pnpm exec tsc --noEmit
SKIP_ENV_VALIDATION=1 pnpm build
```

If `actions-dropdown.tsx` is renamed, format the new path instead. Report existing lint warnings separately from new errors; do not perform unrelated cleanup.

## Acceptance Criteria

- Cohort controls only select rows and never execute data operations directly.
- All copy, download, status, and archive operations act only on the current controlled selection.
- No cohort-specific copies of the action menus or handlers remain.
- Manual checkbox selection and preset selection feed the same action controls.
- Missing Signature selects only students with all required textual information and no signature, without imposing picture or status requirements.
- Selection scope and selected count remain clear when filters change.
- Bulk status updates remain admin-authorized, invalidate the local query, and publish realtime changes through the existing server mutation.
- Bulk archive updates are idempotent, admin-authorized, invalidate the local query, and publish one realtime change after the database update.
- Lint, TypeScript, and build checks pass with no new errors.
