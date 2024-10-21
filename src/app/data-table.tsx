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
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import clsx from "clsx";
import { Camera, HardDriveUpload, Trash, View } from "lucide-react";
import React, { useState } from "react";

import EditStudentDialog from "./edit-dialog";
import { TakePictureButton, UploadPictureButton } from "./upload-button";
import useViewPhotoDialogStore from "./view-photo-dialog-store";

export default function DataTable() {
  const [data] = api.student.getStudents.useSuspenseQuery();
  const [id, setId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleNameClick = (id: number) => {
    setId(id);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex flex-col">
      <EditStudentDialog
        user={{ id }}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Full Name</TableHead>
            <TableHead className="min-w-20 text-center">Picture</TableHead>
            <TableHead className="min-w-20 text-center">Signature</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <Button
                  variant="link"
                  className="p-0 hover:text-base"
                  onClick={() => handleNameClick(student.id)}
                >
                  {student.fullName}
                </Button>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
  const { setIsViewPhotoDialogOpen, setUrl } = useViewPhotoDialogStore();
  const file = props.file;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AlertDialog>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="link" className="w-full p-0">
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
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <UploadPictureButton
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
          <AlertDialogAction className="bg-red-500 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
