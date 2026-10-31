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
import type { studentStatuses } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { toast } from "sonner";

type FileEntry = {
  url: string;
  fileName: string;
};

function hasCompleteInfo(student: GetStudentsOutputType) {
  return Boolean(
    student.lrn &&
      student.fullName &&
      student.grade &&
      student.section &&
      student.emergencyName &&
      student.emergencyNumber &&
      student.emergencyAddress,
  );
}

function isNotPrinted(student: GetStudentsOutputType) {
  return student.status === "not_printed";
}

function isEncoded(student: GetStudentsOutputType) {
  return student.status === "encoded";
}

function hasPrintableLrnAndPhoto(student: GetStudentsOutputType) {
  return Boolean(student.lrn?.trim()) && student.picture !== null;
}

function isReadyToPrintCandidate(student: GetStudentsOutputType) {
  return isNotPrinted(student) && hasPrintableLrnAndPhoto(student);
}

function isReadyToPrint(student: GetStudentsOutputType) {
  return isReadyToPrintCandidate(student) && student.signature !== null;
}

function isComplete(student: GetStudentsOutputType) {
  return (
    hasCompleteInfo(student) &&
    student.picture !== null &&
    student.signature !== null
  );
}

function isMissingSignature(student: GetStudentsOutputType) {
  return hasCompleteInfo(student) && student.signature === null;
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

const statusTargets = [
  { status: "not_printed", label: "Not Printed" },
  { status: "printed", label: "Printed" },
  { status: "encoded", label: "Encoded" },
] as const satisfies ReadonlyArray<{
  status: (typeof studentStatuses)[number];
  label: string;
}>;

export function BulkControls({
  visibleStudents,
  selectedStudents,
  onSelectPreset,
  onClearSelection,
}: {
  visibleStudents: GetStudentsOutputType[];
  selectedStudents: GetStudentsOutputType[];
  onSelectPreset: (students: GetStudentsOutputType[]) => void;
  onClearSelection: () => void;
}) {
  const utils = api.useUtils();

  const notPrintedStudents = visibleStudents.filter(isNotPrinted);
  const readyToPrintStudents = visibleStudents.filter(isReadyToPrint);
  const completeStudents = visibleStudents.filter(isComplete);
  const missingSignatureStudents = visibleStudents.filter(isMissingSignature);
  const readyToPrintCandidateStudents = visibleStudents.filter(
    isReadyToPrintCandidate,
  );
  const encodedStudents = visibleStudents.filter(isEncoded);

  const { mutate: setStatuses, isPending: isSettingStatuses } =
    api.student.setStatuses.useMutation({
      onMutate: async ({ ids, status }) => {
        await utils.student.getStudents.cancel();
        const previousStudents = utils.student.getStudents.getData();
        utils.student.getStudents.setData(
          undefined,
          (old) =>
            old?.map((student) =>
              ids.includes(student.id) ? { ...student, status } : student,
            ) ?? [],
        );
        return { previousStudents };
      },
      onError: (_error, _variables, context) => {
        if (context?.previousStudents) {
          utils.student.getStudents.setData(
            undefined,
            context.previousStudents,
          );
        }
        toast.error("Failed to update student statuses.");
      },
      onSuccess: (_data, { ids, status }) => {
        toast.success(
          `Marked ${ids.length} ${ids.length === 1 ? "student" : "students"} as ${status.replace("_", " ")}.`,
        );
        onClearSelection();
      },
      onSettled: async () => {
        await utils.student.getStudents.invalidate();
      },
    });

  const { mutate: archiveStudents, isPending: isArchivingStudents } =
    api.student.archiveStudents.useMutation({
      onMutate: async ({ ids }) => {
        await utils.student.getStudents.cancel();
        const previousStudents = utils.student.getStudents.getData();
        utils.student.getStudents.setData(
          undefined,
          (old) =>
            old?.map((student) =>
              ids.includes(student.id)
                ? { ...student, isArchived: true }
                : student,
            ) ?? [],
        );
        return { previousStudents };
      },
      onError: (_error, _variables, context) => {
        if (context?.previousStudents) {
          utils.student.getStudents.setData(
            undefined,
            context.previousStudents,
          );
        }
        toast.error("Failed to archive students.");
      },
      onSuccess: (_data, { ids }) => {
        toast.success(
          `Archived ${ids.length} ${ids.length === 1 ? "student" : "students"}.`,
        );
        onClearSelection();
      },
      onSettled: async () => {
        await utils.student.getStudents.invalidate();
      },
    });

  const selectedIds = selectedStudents.map((student) => student.id);
  const selectedPhotoFiles = getPhotoFiles(selectedStudents);
  const selectedSignatureFiles = getSignatureFiles(selectedStudents);

  const handleCopyData = () => copyStudentsToClipboard(selectedStudents, true);
  const handleDownloadPictures = () =>
    downloadFilesAsZip(selectedPhotoFiles, "pictures.zip", "PIC");
  const handleDownloadSignatures = () =>
    downloadFilesAsZip(selectedSignatureFiles, "signatures.zip", "SIG");

  const allSelectedArchived = selectedStudents.every(
    (student) => student.isArchived,
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Select</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel>Selection presets</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={visibleStudents.length === 0}
              onClick={() => onSelectPreset(visibleStudents)}
            >
              All visible ({visibleStudents.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={notPrintedStudents.length === 0}
              onClick={() => onSelectPreset(notPrintedStudents)}
            >
              Not Printed ({notPrintedStudents.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={readyToPrintStudents.length === 0}
              onClick={() => onSelectPreset(readyToPrintStudents)}
            >
              Ready to Print ({readyToPrintStudents.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={readyToPrintCandidateStudents.length === 0}
              onClick={() => onSelectPreset(readyToPrintCandidateStudents)}
            >
              {`Ready but Missing Signature (${readyToPrintCandidateStudents.length})`}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={completeStudents.length === 0}
              onClick={() => onSelectPreset(completeStudents)}
            >
              Complete ({completeStudents.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={missingSignatureStudents.length === 0}
              onClick={() => onSelectPreset(missingSignatureStudents)}
            >
              Missing Signature ({missingSignatureStudents.length})
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={encodedStudents.length === 0}
              onClick={() => onSelectPreset(encodedStudents)}
            >
              Encoded ({encodedStudents.length})
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={selectedStudents.length === 0}
            onClick={onClearSelection}
          >
            Clear selection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={selectedStudents.length === 0}>
            Actions ({selectedStudents.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={selectedStudents.length === 0}
              onClick={handleCopyData}
            >
              Copy data
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedPhotoFiles.length === 0}
              onClick={() =>
                toast.promise(handleDownloadPictures, {
                  loading: "Preparing to download photos...",
                  success: "Successfully downloaded photos!",
                  error: "Failed to download photos",
                })
              }
            >
              Download pictures
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={selectedSignatureFiles.length === 0}
              onClick={() =>
                toast.promise(handleDownloadSignatures, {
                  loading: "Preparing to download signatures...",
                  success: "Successfully downloaded signatures!",
                  error: "Failed to download signatures",
                })
              }
            >
              Download signatures
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mark as</DropdownMenuLabel>
            {statusTargets.map(({ status, label }) => {
              const allSelectedHaveStatus = selectedStudents.every(
                (student) => student.status === status,
              );
              return (
                <DropdownMenuItem
                  key={status}
                  disabled={isSettingStatuses || allSelectedHaveStatus}
                  onClick={() => setStatuses({ ids: selectedIds, status })}
                >
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={isArchivingStudents || allSelectedArchived}
              onClick={() => archiveStudents({ ids: selectedIds })}
            >
              Archive selected
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
