"use client";

import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import {
  useTable,
  type ColumnFiltersState,
  type ReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Container } from "~/components/container";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import type { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { useMemo, useState } from "react";

import { ActionsDropdown } from "./actions-dropdown";
import { studentColumns } from "./columns";
import {
  studentTableFeatures,
  type StudentTableFeatures,
} from "./data-table-features";

export type FilterType = "new" | "all" | "archived";

type StudentTable = ReactTable<StudentTableFeatures, GetStudentsOutputType>;

const columnLabels: Record<string, string> = {
  select: "Select",
  lrn: "LRN",
  fullName: "Full Name",
  grade: "Grade",
  section: "Section",
  emergencyName: "Emergency Name",
  emergencyNumber: "Emergency Number",
  emergencyAddress: "Emergency Address",
  archived: "Archived",
  createdAt: "Created At",
  updatedAt: "Updated At",
};

function StudentViewOptions({ table }: { table: StudentTable }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MixerHorizontalIcon className="h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {columnLabels[column.id] ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DataTable() {
  const [students] = api.student.getStudents.useSuspenseQuery();

  const [filter, setFilter] = useState<FilterType>("new");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (filter === "new" || filter === "archived") {
      filters.push({ id: "archived", value: filter });
    }
    if (search.trim() !== "") {
      filters.push({ id: "fullName", value: search });
    }
    return filters;
  }, [filter, search]);

  const table = useTable({
    features: studentTableFeatures,
    data: students,
    columns: studentColumns,
    getRowId: (student) => String(student.id),
    state: { sorting, rowSelection, columnFilters },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  });

  // Counters describe the selected archive tab: they come from the faceted row
  // model, which applies every filter except the search, so they are unaffected
  // by search, sorting, and row selection.
  const tabStudents =
    table
      .getColumn("fullName")
      ?.getFacetedRowModel()
      .rows.map((row) => row.original) ?? students;

  const studentsWithCompleteInfoCount = tabStudents.filter(
    (student) =>
      student.lrn &&
      student.fullName &&
      student.grade &&
      student.section &&
      student.emergencyName &&
      student.emergencyNumber &&
      student.emergencyAddress &&
      student.picture &&
      student.signature,
  ).length;

  const encodedStudentCount = tabStudents.filter(
    (student) => student.status === "encoded" && !student.isArchived,
  ).length;

  const studentsWithCompletePhotosCount = tabStudents.filter(
    (student) => student.picture && student.signature,
  ).length;

  return (
    <div>
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            id="tabs"
            className="flex gap-2 rounded-lg bg-neutral-200/50 p-1"
          >
            <Button
              onClick={() => setFilter("new")}
              className={cn(
                filter === "new"
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-transparent text-neutral-800 shadow-none hover:bg-neutral-400/20",
              )}
            >
              New Students
            </Button>
            <Button
              onClick={() => setFilter("all")}
              className={cn(
                filter === "all"
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-transparent text-neutral-800 shadow-none hover:bg-neutral-400/20",
              )}
            >
              All Students
            </Button>
            <Button
              onClick={() => setFilter("archived")}
              className={cn(
                filter === "archived"
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-transparent text-neutral-800 shadow-none hover:bg-neutral-400/20",
              )}
            >
              Archive
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-40 lg:w-56"
            />
            <StudentViewOptions table={table} />
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="cursor-default bg-blue-400 text-black hover:bg-blue-500">
                    {encodedStudentCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Students that have been encoded</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="cursor-default bg-green-400 text-black hover:bg-green-500">
                    {studentsWithCompleteInfoCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Students with complete details, photo, and signature
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="cursor-default bg-yellow-400 text-black hover:bg-yellow-500">
                    {studentsWithCompletePhotosCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Students with both photo and signature
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ActionsDropdown students={students} filter={filter} />
          </div>
        </div>
      </Container>
      <Container>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={studentColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}
