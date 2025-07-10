"use client";

import { Container } from "~/components/container";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useState } from "react";

import { ActionsDropdown } from "./actions-dropdown";
import { StudentRow } from "./student-row";

export type FilterType = "new" | "all" | "archived";

export default function DataTable() {
  const [students] = api.student.getStudents.useSuspenseQuery();
  const newStudents = students.filter((s) => !s.isArchived);
  const archivedStudents = students.filter((s) => s.isArchived);

  const [filter, setFilter] = useState<FilterType>("new");

  return (
    <div>
      <Container>
        <div className="flex items-center justify-between gap-2">
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
          <ActionsDropdown students={students} filter={filter} />
        </div>
      </Container>
      <Container>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="">LRN</TableHead>
              <TableHead className="group flex cursor-pointer items-center justify-between hover:bg-neutral-200">
                <span>Full Name</span>
              </TableHead>
              <TableHead className="">Grade</TableHead>
              <TableHead className="">Section</TableHead>
              <TableHead className="">Emergency Name</TableHead>
              <TableHead className="">Emergency Number</TableHead>
              <TableHead className="">Emergency Address</TableHead>
              <TableHead>Printed</TableHead>
              <TableHead>Archived</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filter === "new"
              ? newStudents.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))
              : null}
            {filter === "all"
              ? students.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))
              : null}
            {filter === "archived"
              ? archivedStudents.map((student) => (
                  <StudentRow key={student.id} student={student} />
                ))
              : null}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}
