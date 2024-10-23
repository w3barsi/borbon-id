"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { useUploadThing } from "~/utils/uploadthing";
import { Camera, HardDriveUpload } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

type UploadButton = {
  for: "signature" | "picture";
  user: {
    id: number;
    fullName: string | null;
  };
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function UploadPictureButton(props: UploadButton) {
  const utils = api.useUtils();
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: async () => {
      await utils.student.invalidate();
    },
    onUploadBegin: () => {
      props.setIsOpen(false);
    },
  });
  //
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Check if a file is selected
    const files = event.target.files;
    if (files && files.length === 1 && files[0] !== null) {
      const file = files[0];
      if (file !== undefined) {
        toast.promise(
          startUpload([file], {
            id: props.user.id,
            for: props.for,
          }),
          {
            loading: `Uploading file for ${props.user.fullName ? props.user.fullName : props.user.id}!`,
            success: `Succesfully uploaded file for ${props.user.fullName}!`,
            error: "Failed to upload file!",
          },
        );
      }
    }
  };
  //
  return (
    <label
      htmlFor={`${props.user.id}_${props.for}`}
      className="flex cursor-pointer items-center gap-2 text-sm *:cursor-pointer [&>svg]:size-4 [&>svg]:shrink-0"
    >
      <HardDriveUpload />
      {props.for === "picture" ? "Upload Picture" : "Upload Signature"}
      <Input
        type="file"
        className="hidden"
        accept=".jpg,.jpeg"
        id={`${props.user.id}_${props.for}`}
        onChange={handleFileChange}
      />
    </label>
  );
}

export function TakePictureButton(props: UploadButton) {
  const utils = api.useUtils();
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: async () => {
      await utils.student.invalidate();
    },
    onUploadBegin: () => {
      props.setIsOpen(false);
    },
  });
  //
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Check if a file is selected
    const files = event.target.files;
    if (files && files.length === 1 && files[0] !== null) {
      const file = files[0];
      if (file !== undefined) {
        toast.promise(
          startUpload([file], {
            id: props.user.id,
            for: props.for,
          }),
          {
            loading: `Uploading file for ${props.user.fullName ? props.user.fullName : props.user.id}!`,
            success: `Succesfully uploaded file for ${props.user.fullName}!`,
            error: "Failed to upload file!",
          },
        );
      }
    }
  };
  //
  return (
    <label
      htmlFor={`${props.user.id}_${props.for}`}
      className="flex cursor-pointer items-center gap-2 text-sm *:cursor-pointer [&>svg]:size-4 [&>svg]:shrink-0"
    >
      <Camera />
      {props.for === "picture" ? "Capture Picture" : "Capture Signature"}
      <Input
        type="file"
        capture="environment"
        className="hidden"
        id={`${props.user.id}_${props.for}`}
        accept="image/*"
        onChange={handleFileChange}
      />
    </label>
  );
}
