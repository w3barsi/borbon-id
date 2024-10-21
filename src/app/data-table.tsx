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
import React from "react";

export default function DataTable() {
  const [data] = api.student.getStudents.useSuspenseQuery();

  return (
    <div className="flex flex-col">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Full Name</TableHead>
            <TableHead>Picture</TableHead>
            <TableHead>Signature</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.fullName}</TableCell>
              <TableCell className="w-20">
                <FileDropdown type="picture" file={student.picture} />
              </TableCell>
              <TableCell className="">
                <FileDropdown type="signature" file={student.signature} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FileDropdown(props: {
  type: "signature" | "picture";
  file: {
    name: string | null;
    for: "picture" | "signature" | null;
    key: string;
    type: string | null;
    url: string | null;
  } | null;
}) {
  const file = props.file;
  const a = !!file?.url;
  console.log(a);
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-0 text-blue-800 underline underline-offset-4"
          >
            {file?.url ? "Yes" : "No"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <Camera />
              <span>Take Photo</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <HardDriveUpload />
              <span>Upload Photo</span>
            </DropdownMenuItem>
            {file?.url ? (
              <>
                <DropdownMenuItem className="cursor-pointer">
                  <View />
                  <span>View Photo</span>
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
