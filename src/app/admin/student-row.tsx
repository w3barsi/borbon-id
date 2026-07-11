"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { TableCell, TableRow } from "~/components/ui/table";
import { cn } from "~/lib/utils";
import type { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { saveAs } from "file-saver";
import { useState } from "react";
import { toast } from "sonner";

import { NoteDialog } from "./note-dialog";

function isPhotosComplete(student: GetStudentsOutputType) {
  return (
    student.picture &&
    student.signature &&
    student.status === "not_printed" &&
    !student.isArchived
  );
}

function isStudentComplete(student: GetStudentsOutputType) {
  return (
    student.lrn &&
    student.fullName &&
    student.grade &&
    student.section &&
    student.emergencyName &&
    student.emergencyAddress &&
    student.emergencyNumber &&
    student.picture &&
    student.signature &&
    student.status === "not_printed"
  );
}

async function copyStudentData(student: GetStudentsOutputType) {
  const grade = (student.grade ?? "").toString().trim();
  const lrn = (student.lrn ?? "").trim();
  const fullName = (student.fullName ?? "").trim();
  const emergencyName = (student.emergencyName ?? "").trim();
  const emergencyAddress = (student.emergencyAddress ?? "").trim();
  const emergencyNumber = (student.emergencyNumber ?? "").trim();
  const data = `GRADE ${grade}\t${lrn}\t${fullName}\t${emergencyName}\t${emergencyAddress}\t${emergencyNumber}`;

  await navigator.clipboard.writeText(data.toUpperCase());
  toast.success("Copied student data to clipboard!");
}

async function downloadStudentFile(
  pType: "signature" | "picture",
  url: string | null | undefined,
  fullName: string | null | undefined,
) {
  if (url == null || url == undefined) {
    console.log("No pic");
    return;
  }
  if (fullName == null || fullName == undefined) {
    console.log("No name");
    return;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network response was not ok");

  const blob = await res.blob();
  const fileName = fullName.replaceAll(".", " ").replaceAll(" ", " ");
  if (pType === "picture") {
    saveAs(blob, `${fileName}_PIC`);
  } else {
    saveAs(blob, `${fileName}_SIG`);
  }
}

export function StudentRow({ student }: { student: GetStudentsOutputType }) {
  const utils = api.useUtils();
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const { mutate } = api.student.setStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.student.getStudents.cancel();
      const prevData = utils.student.getStudents.getData();
      utils.student.getStudents.setData(undefined, (old) =>
        old?.map((s) => (s.id === id ? { ...s, status } : s)),
      );
      return { prevData };
    },
    onError: (_err, _variables, context) => {
      if (context?.prevData) {
        utils.student.getStudents.setData(undefined, context.prevData);
      }
    },
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
    },
  });

  const { mutate: archive } = api.student.archive.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
    },
  });

  return (
    <>
      <NoteDialog
        student={student}
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
      />
      <TableRow key={student.id}>
      <TableCell>{student.lrn}</TableCell>
      <TableCell>{student.fullName}</TableCell>
      <TableCell>{student.grade}</TableCell>
      <TableCell>{student.section}</TableCell>
      <TableCell>{student.emergencyName}</TableCell>
      <TableCell>{student.emergencyNumber}</TableCell>
      <TableCell>{student.emergencyAddress}</TableCell>
      <TableCell className="text-center">
        <Button
          variant="secondary"
          className={cn(
            "w-24",
            student.status === "printed" &&
              "border border-green-300 bg-green-200 hover:bg-green-500",
            student.status === "encoded" &&
              "border border-blue-300 bg-blue-200 hover:bg-blue-500",
            student.status === "not_printed" &&
              "border border-red-300 bg-red-200 hover:bg-red-500",
          )}
          onClick={() => {
            const nextStatus = {
              not_printed: "printed",
              printed: "encoded",
              encoded: "not_printed",
            } as const;
            mutate({
              id: student.id,
              status: nextStatus[student.status],
            });
          }}
        >
          {student.status.replace("_", " ")}
        </Button>
      </TableCell>
      <TableCell>
        <Button
          onClick={() => {
            console.log(student.isArchived);
            archive({
              id: student.id,
              archive: student.isArchived,
            });
          }}
        >
          {student.isArchived ? "Unarchive" : "Archive"}
        </Button>
      </TableCell>
      <TableCell>{student.createdAt?.toLocaleString()}</TableCell>
      <TableCell>{student.updatedAt?.toLocaleString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0",
                isPhotosComplete(student) &&
                  "bg-yellow-400 hover:bg-yellow-500",
                isStudentComplete(student) && "bg-green-400 hover:bg-green-500",
              )}
            >
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                downloadStudentFile(
                  "picture",
                  student.picture?.url,
                  student.fullName,
                )
              }
              disabled={student.picture === null}
            >
              Download Photo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                downloadStudentFile(
                  "signature",
                  student.signature?.url,
                  student.fullName,
                )
              }
              disabled={student.signature === null}
            >
              Download Signature
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await copyStudentData(student);
              }}
            >
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsNoteDialogOpen(true)}>
              {student.adminNote?.trim() &&
              student.adminNote.trim() !== "admin_note"
                ? "Edit note"
                : "Add note"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      </TableRow>
    </>
  );
}
