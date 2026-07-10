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
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import type { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { useUploadThing } from "~/utils/uploadthing";
import { Camera, Info, Trash, View } from "lucide-react";
import React, { memo, useRef, useState } from "react";
import { toast } from "sonner";

import EditStudentDialog from "./edit-dialog";
import useViewPhotoDialogStore from "./view-photo-dialog-store";

type StudentFilter = "all" | "incomplete" | "complete" | "printed";

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
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [selectedStudent, setSelectedStudent] =
    useState<GetStudentsOutputType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const filteredData = data.filter((student) => {
    if (filter === "complete") return getMissingFields(student).length === 0;
    if (filter === "incomplete") return getMissingFields(student).length > 0;
    if (filter === "printed") return student.status === "printed";
    return true;
  });

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
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as StudentFilter)}
      >
        <TabsList className="h-auto max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
          <TabsTrigger value="printed">Printed</TabsTrigger>
        </TabsList>
        <TabsContent value={filter}>
          <TooltipProvider delayDuration={0}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center"></TableHead>
                  <TableHead className="w-full">Full Name</TableHead>
                  <TableHead className="min-w-32 text-center">
                    Details
                  </TableHead>
                  <TableHead className="min-w-60 text-center">
                    Created on
                  </TableHead>
                  <TableHead className="min-w-24 text-center">Status</TableHead>
                  <TableHead className="min-w-20 text-center">
                    Picture
                  </TableHead>
                  <TableHead className="min-w-20 text-center">
                    Signature
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      setSelectedStudent={setSelectedStudent}
                      setIsEditDialogOpen={setIsEditDialogOpen}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No students match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </TabsContent>
      </Tabs>
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
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize",
            student.status === "printed" && "bg-green-100 text-green-700",
            student.status === "encoded" && "bg-blue-100 text-blue-700",
            student.status === "not_printed" && "bg-red-100 text-red-700",
          )}
        >
          {student.status.replace("_", " ")}
        </span>
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
    createdAt: Date | null;
  } | null;
}) {
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: deletePhoto } = api.student.deleteUpload.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
    },
  });
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: async () => {
      await utils.student.getStudents.invalidate();
    },
    onUploadBegin: () => {
      setIsOpen(false);
    },
  });

  const { setIsViewPhotoDialogOpen, setUrl } = useViewPhotoDialogStore();
  const file = props.file;
  const uploadedFile = file?.url ? { ...file, url: file.url } : null;
  const [isOpen, setIsOpen] = useState(false);
  const uploadLabel =
    props.for === "picture" ? "Capture Picture" : "Capture Signature";
  const uploadedAtLabel = uploadedFile?.createdAt
    ? `Uploaded: ${uploadedFile.createdAt.toLocaleString()}`
    : uploadedFile
      ? "Uploaded: unknown"
      : "No file uploaded";
  const triggerButton = (
    <Button
      variant="link"
      className={cn("w-full bg-red-100 p-0", {
        "bg-green-100": uploadedFile,
      })}
    >
      {uploadedFile ? "Yes" : "No"}
    </Button>
  );

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    event.target.value = "";

    const uploadPromise = startUpload([selectedFile], {
      id: props.user.id,
      for: props.for,
    }).then((result) => {
      if (!result) {
        throw new Error("Upload did not start");
      }

      return result;
    });

    toast.promise(uploadPromise, {
      loading: `Uploading file for ${props.user.fullName ?? props.user.id}!`,
      success: `Succesfully uploaded file for ${props.user.fullName ?? props.user.id}!`,
      error: "Failed to upload file!",
    });
  };

  return (
    <AlertDialog>
      <Input
        ref={inputRef}
        type="file"
        capture="environment"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        {uploadedFile ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{uploadedAtLabel}</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
        )}
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setIsOpen(false);
                inputRef.current?.click();
              }}
            >
              <Camera />
              {uploadLabel}
            </DropdownMenuItem>
            {uploadedFile ? (
              <>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setUrl(uploadedFile.url);
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
      {uploadedFile ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            Are you sure you want to delete photo?
          </AlertDialogHeader>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            photo.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-700"
              onClick={() => {
                toast.promise(
                  new Promise<void>((resolve, reject) => {
                    deletePhoto(
                      { key: uploadedFile.key, for: props.for },
                      {
                        onSuccess: () => resolve(),
                        onError: reject,
                      },
                    );
                  }),
                  {
                    loading: "Deleting photo...",
                    success: "Photo deleted.",
                    error: "Failed to delete photo.",
                  },
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}
