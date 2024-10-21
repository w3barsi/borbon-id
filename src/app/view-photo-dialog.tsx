"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";

import useViewPhotoDialogStore from "./view-photo-dialog-store";

export default function ViewPhotoDialog() {
  const { isViewPhotoDialogOpen, setIsViewPhotoDialogOpen, url } =
    useViewPhotoDialogStore();

  return (
    <Dialog
      open={isViewPhotoDialogOpen}
      onOpenChange={setIsViewPhotoDialogOpen}
    >
      <DialogContent className="h-[90%] max-w-[90%]">
        <DialogTitle></DialogTitle>
        <DialogDescription></DialogDescription>
        <Image
          width={766}
          height={0}
          src={url}
          alt="BIG IMAGE"
          className="absolute h-full w-full rounded-sm object-contain object-center sm:rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
