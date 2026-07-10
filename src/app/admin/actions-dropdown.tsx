"use client";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
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
  return filter === "new" ? students.filter((s) => !s.isArchived) : students;
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
      s.status === "not_printed" && s.picture !== null && s.signature !== null,
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
                  <DropdownMenuItem onClick={handleCopyCompleteStudentsData}>
                    Copy data
                  </DropdownMenuItem>
                  <DropdownMenuItem
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
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                      disabled={
                        completeStudentIds.length === 0 || isSettingBulkStatus
                      }
                    >
                      Mark as
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuGroup>
                          <DropdownMenuItem
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
