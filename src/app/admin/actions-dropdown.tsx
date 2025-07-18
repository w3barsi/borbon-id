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

export function ActionsDropdown({
  students,
  filter,
}: {
  students: GetStudentsOutputType[];
  filter: FilterType;
}) {
  const copyAllData = async () => {
    const a: string[] = [];
    const filteredStudents =
      filter === "new" ? students.filter((s) => !s.isArchived) : students;
    filteredStudents.forEach((student) => {
      const grade = (student.grade ?? "").toString().trim();
      const lrn = (student.lrn ?? "").trim();
      const fullName = (student.fullName ?? "").trim();
      const emergencyName = (student.emergencyName ?? "").trim();
      const emergencyAddress = (student.emergencyAddress ?? "").trim();
      const emergencyNumber = (student.emergencyNumber ?? "").trim();
      a.push(
        `GRADE ${grade}\t${lrn}\t${fullName}\t${emergencyName}\t${emergencyAddress}\t${emergencyNumber}`,
      );
    });

    await navigator.clipboard.writeText(a.join("\n"));
    toast.success("Copied all data to clipboard!");
  };

  const copyAllNotPrintedData = async () => {
    const a: string[] = [];
    const filteredStudents =
      filter === "new"
        ? students.filter((s) => !s.isArchived).filter((s) => !s.isPrinted)
        : students;
    filteredStudents.forEach((student) => {
      const grade = (student.grade ?? "").toString().trim();
      const lrn = (student.lrn ?? "").trim();
      const fullName = (student.fullName ?? "").trim();
      const emergencyName = (student.emergencyName ?? "").trim();
      const emergencyAddress = (student.emergencyAddress ?? "").trim();
      const emergencyNumber = (student.emergencyNumber ?? "").trim();
      a.push(
        `GRADE ${grade}\t${lrn}\t${fullName}\t${emergencyName}\t${emergencyAddress}\t${emergencyNumber}`,
      );
    });

    await navigator.clipboard.writeText(a.join("\n"));
    toast.success("Copied all data to clipboard!");
  };

  const bulkDownloadPhotos = async () => {
    console.log("Downloading");
    const zip = new JSZip();

    const fetchAndAddToZip = async (url: string, fileName: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        const type = blob.type.split("/");
        const fn = fileName.replaceAll(".", " ");

        zip.file(`${fn} PIC.${type[1]}`, blob);
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
      }
    };

    const filteredStudents =
      filter === "new" ? students.filter((s) => !s.isArchived) : students;

    const filePromises = filteredStudents.map(async (s) => {
      try {
        if (s.picture === null || s.fullName === null)
          throw new Error(`Failed to get pics for ${s.fullName}`);
      } catch (e) {
        return console.error(e);
      }
      return fetchAndAddToZip(s.picture.url!, s.fullName);
    });

    await Promise.all(filePromises);

    const zipfile = await zip.generateAsync({ type: "blob" });
    saveAs(zipfile, "pictures.zip");
  };

  const bulkDownloadNotPrintedPhotos = async () => {
    console.log("Downloading");
    const zip = new JSZip();

    const fetchAndAddToZip = async (url: string, fileName: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        const type = blob.type.split("/");
        const fn = fileName.replaceAll(".", " ");

        zip.file(`${fn} PIC.${type[1]}`, blob);
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
      }
    };

    const filteredStudents =
      filter === "new"
        ? students.filter((s) => !s.isArchived).filter((s) => !s.isPrinted)
        : students;

    const filePromises = filteredStudents.map(async (s) => {
      try {
        if (s.picture === null || s.fullName === null)
          throw new Error(`Failed to get pics for ${s.fullName}`);
      } catch (e) {
        return console.error(e);
      }
      return fetchAndAddToZip(s.picture.url!, s.fullName);
    });

    await Promise.all(filePromises);

    const zipfile = await zip.generateAsync({ type: "blob" });
    saveAs(zipfile, "pictures.zip");
  };

  const bulkDownloadSignatures = async () => {
    console.log("Downloading");
    const zip = new JSZip();

    const fetchAndAddToZip = async (url: string, fileName: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        const type = blob.type.split("/");
        const fn = fileName.replaceAll(".", " ");

        zip.file(`${fn} SIG.${type[1]}`, blob);
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
      }
    };

    const filteredStudents =
      filter === "new" ? students.filter((s) => !s.isArchived) : students;

    const filePromises = filteredStudents.map(async (s) => {
      try {
        if (s.signature === null || s.fullName === null)
          throw new Error(`Failed to get pics for ${s.fullName}`);
      } catch (e) {
        return console.error(e);
      }
      return fetchAndAddToZip(s.signature.url!, s.fullName);
    });

    await Promise.all(filePromises);

    const zipfile = await zip.generateAsync({ type: "blob" });
    saveAs(zipfile, "signatures.zip");
  };

  const bulkDownloadNotPrintedSignatures = async () => {
    console.log("Downloading");
    const zip = new JSZip();

    const fetchAndAddToZip = async (url: string, fileName: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        const type = blob.type.split("/");
        const fn = fileName.replaceAll(".", " ");

        zip.file(`${fn} SIG.${type[1]}`, blob);
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
      }
    };

    const filteredStudents =
      filter === "new"
        ? students.filter((s) => !s.isArchived).filter((s) => !s.isPrinted)
        : students;

    const filePromises = filteredStudents.map(async (s) => {
      try {
        if (s.signature === null || s.fullName === null)
          throw new Error(`Failed to get pics for ${s.fullName}`);
      } catch (e) {
        return console.error(e);
      }
      return fetchAndAddToZip(s.signature.url!, s.fullName);
    });

    await Promise.all(filePromises);

    const zipfile = await zip.generateAsync({ type: "blob" });
    saveAs(zipfile, "signatures.zip");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Bulk Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>All</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={copyAllData}>Copy Data</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              toast.promise(bulkDownloadPhotos, {
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
              toast.promise(bulkDownloadSignatures, {
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
          <DropdownMenuItem onClick={copyAllNotPrintedData}>
            Copy Data
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              toast.promise(bulkDownloadNotPrintedPhotos, {
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
              toast.promise(bulkDownloadNotPrintedSignatures, {
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
