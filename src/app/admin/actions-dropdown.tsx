"use client";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";

import type { FilterType } from "./table";

type FileEntry = {
  url: string;
  fileName: string;
};

function getBaseStudents(
  students: GetStudentsOutputType[],
  filter: FilterType,
) {
  if (filter === "new") return students.filter((s) => !s.isArchived);
  if (filter === "archived") return students.filter((s) => s.isArchived);
  return students;
}

function formatStudentRow(student: GetStudentsOutputType, compactLrn: boolean) {
  const grade = (student.grade ?? "").toString().trim();
  const lrn = (student.lrn ?? "").trim();
  const fullName = (student.fullName ?? "").trim();
  const emergencyName = (student.emergencyName ?? "").trim();
  const emergencyAddress = (student.emergencyAddress ?? "").trim();
  const emergencyNumber = (student.emergencyNumber ?? "").trim();
  const formattedLrn = compactLrn ? lrn.split(" ").join("") : lrn;

  return `GRADE ${grade}\t${formattedLrn}\t${fullName}\t${emergencyName}\t${emergencyAddress}\t${emergencyNumber}`;
}

async function copyStudentsToClipboard(
  students: GetStudentsOutputType[],
  compactLrn: boolean,
) {
  const text = students
    .map((s) => formatStudentRow(s, compactLrn))
    .join("\n")
    .toUpperCase();

  await navigator.clipboard.writeText(text);
  toast.success(
    `Copied ${students.length} ${students.length === 1 ? "row" : "rows"} to clipboard!`,
  );
}

async function fetchAndAddToZip(
  zip: JSZip,
  url: string,
  fileName: string,
  extPrefix: "PIC" | "SIG",
) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);

    const blob = await response.blob();
    const type = blob.type.split("/")[1];
    const fn = fileName.replaceAll(".", " ");

    zip.file(`${fn} ${extPrefix}.${type}`, blob);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

async function downloadFilesAsZip(
  files: FileEntry[],
  zipName: string,
  extPrefix: "PIC" | "SIG",
) {
  const zip = new JSZip();

  await Promise.all(
    files.map((file) =>
      fetchAndAddToZip(zip, file.url, file.fileName, extPrefix),
    ),
  );

  const zipfile = await zip.generateAsync({ type: "blob" });
  saveAs(zipfile, zipName);
}

function getPhotoFiles(students: GetStudentsOutputType[]): FileEntry[] {
  return students
    .filter((s) => s.picture !== null && s.fullName !== null)
    .map((s) => ({ url: s.picture!.url!, fileName: s.fullName! }));
}

function getSignatureFiles(students: GetStudentsOutputType[]): FileEntry[] {
  return students
    .filter((s) => s.signature !== null && s.fullName !== null)
    .map((s) => ({ url: s.signature!.url!, fileName: s.fullName! }));
}

export function ActionsDropdown({
  students,
  filter,
}: {
  students: GetStudentsOutputType[];
  filter: FilterType;
}) {
  const utils = api.useUtils();
  const baseStudents = getBaseStudents(students, filter);
  const notPrintedStudents = baseStudents.filter(
    (s) => s.status === "not_printed",
  );
  const readyToPrintStudents = baseStudents.filter(
    (s) =>
      s.status === "not_printed" &&
      Boolean(s.lrn?.trim()) &&
      s.picture !== null &&
      s.signature !== null,
  );
  const completeStudents = baseStudents.filter(
    (s) =>
      s.lrn &&
      s.fullName &&
      s.grade &&
      s.section &&
      s.emergencyName &&
      s.emergencyNumber &&
      s.emergencyAddress &&
      s.picture &&
      s.signature,
  );
  const completeNotPrintedStudents = completeStudents.filter(
    (student) => student.status === "not_printed",
  );
  const completeEncodedStudents = completeStudents.filter(
    (student) => student.status === "encoded",
  );
  const completeStudentIds = completeStudents.map((student) => student.id);
  const encodedStudentIds = baseStudents
    .filter((student) => student.status === "encoded")
    .map((student) => student.id);

  const { mutate: setBulkStatus, isPending: isSettingBulkStatus } =
    api.student.setStatuses.useMutation({
      onSuccess: async (_data, { ids, status }) => {
        toast.success(
          `Marked ${ids.length} ${ids.length === 1 ? "student" : "students"} as ${status.replace("_", " ")}.`,
        );
        await utils.student.getStudents.invalidate();
      },
      onError: () => toast.error("Failed to update student statuses."),
    });

  const handleCopyAllData = () => copyStudentsToClipboard(baseStudents, false);
  const handleCopyAllNotPrintedData = () =>
    copyStudentsToClipboard(notPrintedStudents, true);
  const handleCopyReadyToPrintData = () =>
    copyStudentsToClipboard(readyToPrintStudents, true);
  const handleCopyCompleteNotPrintedData = () =>
    copyStudentsToClipboard(completeNotPrintedStudents, true);
  const handleCopyCompleteEncodedData = () =>
    copyStudentsToClipboard(completeEncodedStudents, true);
  const handleCopyCompleteStudentsData = () =>
    copyStudentsToClipboard(completeStudents, true);

  const handleDownloadPhotos = () =>
    downloadFilesAsZip(getPhotoFiles(baseStudents), "pictures.zip", "PIC");
  const handleDownloadNotPrintedPhotos = () =>
    downloadFilesAsZip(
      getPhotoFiles(notPrintedStudents),
      "pictures.zip",
      "PIC",
    );
  const handleDownloadReadyToPrintPhotos = () =>
    downloadFilesAsZip(
      getPhotoFiles(readyToPrintStudents),
      "pictures.zip",
      "PIC",
    );
  const handleDownloadCompleteStudentsPhotos = () =>
    downloadFilesAsZip(getPhotoFiles(completeStudents), "pictures.zip", "PIC");

  const handleDownloadSignatures = () =>
    downloadFilesAsZip(
      getSignatureFiles(baseStudents),
      "signatures.zip",
      "SIG",
    );
  const handleDownloadNotPrintedSignatures = () =>
    downloadFilesAsZip(
      getSignatureFiles(notPrintedStudents),
      "signatures.zip",
      "SIG",
    );
  const handleDownloadReadyToPrintSignatures = () =>
    downloadFilesAsZip(
      getSignatureFiles(readyToPrintStudents),
      "signatures.zip",
      "SIG",
    );
  const handleDownloadCompleteStudentsSignatures = () =>
    downloadFilesAsZip(
      getSignatureFiles(completeStudents),
      "signatures.zip",
      "SIG",
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Bulk Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>All</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="w-64 whitespace-normal text-xs font-normal leading-snug text-muted-foreground">
                    Every student in the current table view.
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyAllData}>
                    Copy data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.promise(handleDownloadPhotos, {
                        loading: "Preparing to download photos...",
                        success: "Successfully downloaded photos!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Pictures
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.promise(handleDownloadSignatures, {
                        loading: "Preparing to download signatures...",
                        success: "Successfully downloaded signatures!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Signatures
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Not Printed</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="w-64 whitespace-normal text-xs font-normal leading-snug text-muted-foreground">
                    Students in the current view with Not Printed status.
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyAllNotPrintedData}>
                    Copy data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.promise(handleDownloadNotPrintedPhotos, {
                        loading: "Preparing to download photos...",
                        success: "Successfully downloaded photos!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Pictures
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.promise(handleDownloadNotPrintedSignatures, {
                        loading: "Preparing to download signatures...",
                        success: "Successfully downloaded signatures!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Signatures
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Ready to Print</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="w-64 whitespace-normal text-xs font-normal leading-snug text-muted-foreground">
                    Not Printed students with an LRN, picture, and signature.
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyReadyToPrintData}>
                    Copy data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.promise(handleDownloadReadyToPrintPhotos, {
                        loading: "Preparing to download photos...",
                        success: "Successfully downloaded photos!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Pictures
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.promise(handleDownloadReadyToPrintSignatures, {
                        loading: "Preparing to download signatures...",
                        success: "Successfully downloaded signatures!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Signatures
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Complete</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="w-64 whitespace-normal text-xs font-normal leading-snug text-muted-foreground">
                    Students with all required details, a picture, and a
                    signature.
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Copy</DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={completeNotPrintedStudents.length === 0}
                    onClick={handleCopyCompleteNotPrintedData}
                  >
                    Copy not printed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={completeEncodedStudents.length === 0}
                    onClick={handleCopyCompleteEncodedData}
                  >
                    Copy encoded
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={completeStudents.length === 0}
                    onClick={handleCopyCompleteStudentsData}
                  >
                    Copy all complete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Downloads</DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={completeStudents.length === 0}
                    onClick={() =>
                      toast.promise(handleDownloadCompleteStudentsPhotos, {
                        loading: "Preparing to download photos...",
                        success: "Successfully downloaded photos!",
                        error: "Failed to download photos",
                      })
                    }
                  >
                    Download Pictures
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={completeStudents.length === 0}
                    onClick={() =>
                      toast.promise(handleDownloadCompleteStudentsSignatures, {
                        loading: "Preparing to download signatures...",
                        success: "Successfully downloaded signatures!",
                        error: "Failed to download signatures",
                      })
                    }
                  >
                    Download Signatures
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Mark as</DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={
                      completeStudentIds.length === 0 || isSettingBulkStatus
                    }
                    onClick={() =>
                      setBulkStatus({
                        ids: completeStudentIds,
                        status: "not_printed",
                      })
                    }
                  >
                    Not Printed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={
                      completeStudentIds.length === 0 || isSettingBulkStatus
                    }
                    onClick={() =>
                      setBulkStatus({
                        ids: completeStudentIds,
                        status: "printed",
                      })
                    }
                  >
                    Printed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={
                      completeStudentIds.length === 0 || isSettingBulkStatus
                    }
                    onClick={() =>
                      setBulkStatus({
                        ids: completeStudentIds,
                        status: "encoded",
                      })
                    }
                  >
                    Encoded
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            disabled={encodedStudentIds.length === 0 || isSettingBulkStatus}
            onClick={() =>
              setBulkStatus({ ids: encodedStudentIds, status: "printed" })
            }
          >
            Mark Encoded as Printed
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
