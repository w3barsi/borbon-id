"use client";

import { Container } from "~/components/container";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useState } from "react";

type PhotoDownload = {
  name: string;
  url: string | null | undefined;
};

export default function DataTable() {
  const [students] = api.student.getStudents.useSuspenseQuery();
  console.log(students);

  const handleCopy = async (student: GetStudentsOutputType) => {
    const data = `GRADE ${student.grade}\t${student.lrn}\t${student.fullName}\t${student.emergencyName}\t${student.emergencyAddress}\t${student.emergencyNumber}`;

    await navigator.clipboard.writeText(data);
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

    const filePromises = students.map(async (s) => {
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

    const filePromises = students.map(async (s) => {
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

  const downloadPhoto = async (
    url: string | null | undefined,
    fullName: string | null | undefined,
  ) => {
    if (url == null || url == undefined) {
      console.log("No pic");
      return;
    }
    if (fullName == null || fullName == undefined) {
      console.log("No name");
      return;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response was not ok");

    const blob = await res.blob();
    const fileName = fullName.replaceAll(".", " ").replaceAll(" ", " ");
    saveAs(blob, `${fileName}_PIC`);
  };

  return (
    <div>
      <Container>
        <div className="flex gap-2">
          <div className="w-full"></div>
          <Button onClick={downloadAllPhotos}>Download All Pictures</Button>
          <Button onClick={downloadAllSignatures}>
            Download All Signatures
          </Button>
        </div>
      </Container>
      <Container>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="">LRN</TableHead>
              <TableHead className="">Full Name</TableHead>
              <TableHead className="">Grade</TableHead>
              <TableHead className="">Section</TableHead>
              <TableHead className="">Emergency Name</TableHead>
              <TableHead className="">Emergency Number</TableHead>
              <TableHead className="">Emergency Address</TableHead>
              <TableHead className="">Is Printed</TableHead>
              <TableHead className="">Copy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.lrn}</TableCell>
                <TableCell>{student.fullName}</TableCell>
                <TableCell>{student.grade}</TableCell>
                <TableCell>{student.section}</TableCell>
                <TableCell>{student.emergencyName}</TableCell>
                <TableCell>{student.emergencyNumber}</TableCell>
                <TableCell>{student.emergencyAddress}</TableCell>
                <TableCell>
                  <Button
                    onClick={() =>
                      downloadPhoto(student.picture?.url, student.fullName)
                    }
                  >
                    Download Photo
                  </Button>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleCopy(student)}>Copy</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}
