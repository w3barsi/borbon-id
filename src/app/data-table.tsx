"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { Info, Trash, View } from "lucide-react";
import React, { memo, useState } from "react";

import EditStudentDialog from "./edit-dialog";
import { TakePictureButton } from "./upload-button";
import useViewPhotoDialogStore from "./view-photo-dialog-store";

function getMissingFields(student: GetStudentsOutputType) {
  return [
    !student.fullName && "Full Name",
    !student.lrn && "LRN",
    student.grade == null && "Grade",
    !student.emergencyName && "Emergency Name",
    !student.emergencyNumber && "Emergency Number",
    !student.emergencyAddress && "Emergency Address",
    !student.picture?.url && "Picture",
    !student.signature?.url && "Signature",
  ].filter(Boolean) as string[];
}

export default function DataTable() {
  const [data] = api.student.getStudents.useSuspenseQuery();
  const [selectedStudent, setSelectedStudent] =
    useState<GetStudentsOutputType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {selectedStudent && (
        <EditStudentDialog
          key={selectedStudent.id}
          student={selectedStudent}
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
        />
      )}
      <TooltipProvider delayDuration={0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center"></TableHead>
              <TableHead className="w-full">Full Name</TableHead>
              <TableHead className="min-w-32 text-center">Details</TableHead>
              <TableHead className="min-w-60 text-center">Created on</TableHead>
              <TableHead className="min-w-20 text-center">Is Printed</TableHead>
              <TableHead className="min-w-20 text-center">Picture</TableHead>
              <TableHead className="min-w-20 text-center">Signature</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                setSelectedStudent={setSelectedStudent}
                setIsEditDialogOpen={setIsEditDialogOpen}
              />
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}

const StudentRow = memo(function StudentRow(props: {
  student: GetStudentsOutputType;
  setSelectedStudent: React.Dispatch<
    React.SetStateAction<GetStudentsOutputType | null>
  >;
  setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { student, setSelectedStudent, setIsEditDialogOpen } = props;
  const missing = getMissingFields(student);

  return (
    <TableRow>
      <TableCell className="text-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full p-1",
                missing.length > 0 ? "text-red-600" : "text-green-600",
              )}
            >
              <Info className="h-4 w-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {missing.length > 0 ? (
                missing.map((field) => (
                  <span key={field}>Missing: {field}</span>
                ))
              ) : (
                <span>All details complete</span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Button
          variant="link"
          onClick={() => {
            setSelectedStudent(student);
            setIsEditDialogOpen(true);
          }}
        >
          {student.fullName}
        </Button>
      </TableCell>
      <TableCell className="text-center">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
            missing.length > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700",
          )}
        >
          {missing.length > 0 ? "Incomplete" : "Complete"}
        </span>
      </TableCell>
      <TableCell>
        <p className="text-center">{student.createdAt.toLocaleString()}</p>
      </TableCell>
      <TableCell className="text-center">
        {student.isPrinted ? "🟩" : "🟥"}
      </TableCell>
      <TableCell>
        <FileDropdown
          for="picture"
          file={student.picture}
          user={{ id: student.id, fullName: student.fullName }}
        />
      </TableCell>
      <TableCell>
        <FileDropdown
          for="signature"
          file={student.signature}
          user={{ id: student.id, fullName: student.fullName }}
        />
      </TableCell>
    </TableRow>
  );
});

function FileDropdown(props: {
  for: "signature" | "picture";
  user: {
    id: number;
    fullName: string | null;
  };
  file: {
    name: string | null;
    key: string;
    type: string | null;
    url: string | null;
  } | null;
}) {
  const utils = api.useUtils();
  const { mutate: deletePhoto } = api.student.deleteUpload.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
    },
  });

  const { setIsViewPhotoDialogOpen, setUrl } = useViewPhotoDialogStore();
  const file = props.file;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="link"
            className={cn("w-full bg-red-100 p-0", {
              "bg-green-100": file?.url,
            })}
          >
            {file?.url ? "Yes" : "No"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <TakePictureButton
                for={props.for}
                user={{ id: props.user.id, fullName: props.user.fullName }}
                setIsOpen={setIsOpen}
              />
            </DropdownMenuItem>
            {file?.url ? (
              <>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setUrl(props.file?.url ?? "");
                    setIsViewPhotoDialogOpen(true);
                  }}
                >
                  <View />
                  View Photo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className={cn("group cursor-pointer focus:bg-red-500")}
                  >
                    <Trash className="text-red-500 group-focus:text-white" />
                    <span className="text-red-500 group-focus:text-white">
                      Delete Photo
                    </span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          Are you sure you want to delete photo?
        </AlertDialogHeader>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the photo.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-700"
            onClick={() => {
              deletePhoto({ key: file!.key, for: props.for });
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
