"use client";

import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { useUploadThing } from "~/utils/uploadthing";
import { Camera, HardDriveUpload } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (files?.length === 1 && files[0] !== null) {
      const file = files[0];
      if (file !== undefined) {
        toast.promise(
          startUpload([file], {
            id: props.user.id,
            for: props.for,
          }),
          {
            loading: `Uploading file for ${props.user.fullName ?? props.user.id}!`,
            success: `Succesfully uploaded file for ${props.user.fullName}!`,
            error: "Failed to upload file!",
          },
        );
        event.target.value = "";
      }
    }
  };
  //
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer items-center gap-2 text-sm *:cursor-pointer [&>svg]:size-4 [&>svg]:shrink-0"
    >
      <HardDriveUpload />
      {props.for === "picture" ? "Upload Picture" : "Upload Signature"}
      <Input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture={false}
        onChange={handleFileChange}
      />
    </button>
  );
}

export function TakePictureButton(props: UploadButton) {
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (files?.length === 1 && files[0] !== null) {
      const file = files[0];
      if (file !== undefined) {
        toast.promise(
          startUpload([file], {
            id: props.user.id,
            for: props.for,
          }),
          {
            loading: `Uploading file for ${props.user.fullName ?? props.user.id}!`,
            success: `Succesfully uploaded file for ${props.user.fullName}!`,
            error: "Failed to upload file!",
          },
        );
        event.target.value = "";
      }
    }
  };
  //
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer items-center gap-2 text-sm *:cursor-pointer [&>svg]:size-4 [&>svg]:shrink-0"
    >
      <Camera />
      {props.for === "picture" ? "Capture Picture" : "Capture Signature"}
      <Input
        ref={inputRef}
        type="file"
        capture="environment"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </button>
  );
}
