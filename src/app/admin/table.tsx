"use client";

import { Container } from "~/components/container";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
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
import { api } from "~/trpc/react";
import { useState } from "react";

import { ActionsDropdown } from "./actions-dropdown";
import { StudentRow } from "./student-row";

export type FilterType = "new" | "all" | "archived";

export default function DataTable() {
  const [students] = api.student.getStudents.useSuspenseQuery();

  const [filter, setFilter] = useState<FilterType>("new");

  const [orderBy, setOrderBy] = useState<"asc" | "desc" | "">("");

  const handleSort = () => {
    if (orderBy === "") setOrderBy("asc");
    else if (orderBy === "asc") setOrderBy("desc");
    else setOrderBy("");
  };

  const baseStudents =
    filter === "new"
      ? students.filter((s) => !s.isArchived)
      : filter === "archived"
        ? students.filter((s) => s.isArchived)
        : students;

  const filteredStudents = orderBy
    ? [...baseStudents].sort((a, b) => {
        const dateA = a.updatedAt?.getTime() ?? 0;
        const dateB = b.updatedAt?.getTime() ?? 0;
        return orderBy === "asc" ? dateA - dateB : dateB - dateA;
      })
    : baseStudents;

  const studentsWithCompleteInfoCount = filteredStudents.filter(
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

  const studentsWithCompletePhotosCount = filteredStudents.filter(
    (student) => student.picture && student.signature,
  ).length;

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
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={0}>
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
            <TableRow>
              <TableHead className="">LRN</TableHead>
              <TableHead className="group flex items-center justify-between hover:bg-neutral-200">
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
              <TableHead>
                Updated At
                <button
                  onClick={handleSort}
                  className={cn(
                    "ml-1 inline-block",
                    orderBy === "" && "text-neutral-400",
                  )}
                >
                  {orderBy === "asc" ? "↑" : orderBy === "desc" ? "↓" : "⇅"}
                </button>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <StudentRow key={student.id} student={student} />
            ))}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}
