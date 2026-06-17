"use client";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { GetStudentsOutputType } from "~/server/api/routers/students";
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
  return filter === "new"
    ? students.filter((s) => !s.isArchived)
    : students;
}

function formatStudentRow(
  student: GetStudentsOutputType,
  compactLrn: boolean,
) {
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
  toast.success("Copied all data to clipboard!");
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

function getPhotoFiles(
  students: GetStudentsOutputType[],
): FileEntry[] {
  return students
    .filter((s) => s.picture !== null && s.fullName !== null)
    .map((s) => ({ url: s.picture!.url!, fileName: s.fullName! }));
}

function getSignatureFiles(
  students: GetStudentsOutputType[],
): FileEntry[] {
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
  const baseStudents = getBaseStudents(students, filter);
  const notPrintedStudents = baseStudents.filter((s) => !s.isPrinted);
  const readyToPrintStudents = baseStudents.filter(
    (s) =>
      !s.isPrinted && s.picture !== null && s.signature !== null,
  );

  const handleCopyAllData = () => copyStudentsToClipboard(baseStudents, false);
  const handleCopyAllNotPrintedData = () =>
    copyStudentsToClipboard(notPrintedStudents, true);
  const handleCopyReadyToPrintData = () =>
    copyStudentsToClipboard(readyToPrintStudents, true);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Bulk Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>All</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleCopyAllData}>
            Copy Data
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
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Not Printed</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleCopyAllNotPrintedData}>
            Copy Data
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
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Ready to print</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleCopyReadyToPrintData}>
            Copy Data
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
