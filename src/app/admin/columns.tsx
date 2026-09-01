"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
} from "@radix-ui/react-icons";
import { createColumnHelper, type SortFn } from "@tanstack/react-table";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import type { GetStudentsOutputType } from "~/server/api/routers/students";

import type { StudentTableFeatures } from "./data-table-features";
import {
  StudentActionsCell,
  StudentArchiveCell,
  StudentStatusCell,
} from "./student-cells";

const columnHelper = createColumnHelper<
  StudentTableFeatures,
  GetStudentsOutputType
>();

function formatDate(value: Date | null) {
  return value?.toLocaleString() ?? null;
}

const sortByUpdatedAt: SortFn<StudentTableFeatures, GetStudentsOutputType> = (
  rowA,
  rowB,
  columnId,
) => {
  const a = rowA.getValue<Date | null>(columnId)?.getTime() ?? 0;
  const b = rowB.getValue<Date | null>(columnId)?.getTime() ?? 0;
  return a - b;
};

export const studentColumns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomeRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    enableHiding: false,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  }),
  columnHelper.accessor("lrn", {
    header: "LRN",
    enableSorting: false,
  }),
  columnHelper.accessor("fullName", {
    header: "Full Name",
    enableSorting: false,
    filterFn: "includesString",
  }),
  columnHelper.accessor("grade", {
    header: "Grade",
    enableSorting: false,
  }),
  columnHelper.accessor("section", {
    header: "Section",
    enableSorting: false,
  }),
  columnHelper.accessor("emergencyName", {
    header: "Emergency Name",
    enableSorting: false,
  }),
  columnHelper.accessor("emergencyNumber", {
    header: "Emergency Number",
    enableSorting: false,
  }),
  columnHelper.accessor("emergencyAddress", {
    header: "Emergency Address",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="block min-w-48 whitespace-normal">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StudentStatusCell student={row.original} />,
  }),
  columnHelper.accessor("isArchived", {
    id: "archived",
    header: "Archived",
    enableSorting: false,
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === "new") return !row.getValue<boolean>(columnId);
      if (filterValue === "archived") return row.getValue<boolean>(columnId);
      return true;
    },
    cell: ({ row }) => <StudentArchiveCell student={row.original} />,
  }),
  columnHelper.accessor("createdAt", {
    header: "Created At",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap">{formatDate(getValue())}</span>
    ),
  }),
  columnHelper.accessor("updatedAt", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={column.getToggleSortingHandler()}
        aria-label="Sort by updated at"
      >
        Updated At
        {column.getIsSorted() === "asc" ? (
          <ArrowUpIcon className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDownIcon className="ml-1" />
        ) : (
          <CaretSortIcon className="ml-1 text-neutral-400" />
        )}
      </Button>
    ),
    sortFn: sortByUpdatedAt,
    sortDescFirst: false,
    cell: ({ getValue }) => (
      <span className="whitespace-nowrap">{formatDate(getValue())}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    enableHiding: false,
    cell: ({ row }) => <StudentActionsCell student={row.original} />,
  }),
]);
