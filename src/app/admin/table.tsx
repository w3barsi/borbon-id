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
import { type GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import {
  ArrowDownAz,
  ArrowDownZa,
  ArrowUpAz,
  ArrowUpDown,
  ArrowUpZa,
} from "lucide-react";
import { useEffect, useState } from "react";

type PhotoDownload = {
  name: string;
  url: string | null | undefined;
};

export default function DataTable() {
  const utils = api.useUtils();

  const [students] = api.student.getStudents.useSuspenseQuery();
  const [state, setState] = useState(new Map<string, boolean>());
  const { mutate } = api.student.setIsPrinted.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
    },
  });

  const [sortedStudents, setSortedStudents] = useState(students);
  const [sortBy, setSortBy] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    setSortedStudents(students);
    console.log(students);
  }, [students]);

  const addOrUpdate = (key: string) => {
    setState((prevMap) => {
      const updatedMap = new Map(prevMap);
      const prev = prevMap.get(key);
      updatedMap.set(key, !prev);
      return updatedMap;
    });
  };

  const copyAllData = async () => {
    const a: string[] = [];
    students.forEach((student) => {
      a.push(
        `GRADE ${student.grade}\t${student.lrn}\t${student.fullName}\t${student.emergencyName}\t${student.emergencyAddress}\t${student.emergencyNumber}`,
      );
    });

    await navigator.clipboard.writeText(a.join("\n"));
  };

  const handleCopy = async (student: GetStudentsOutputType) => {
    const data = `GRADE ${student.grade}\t${student.lrn}\t${student.fullName}\t${student.emergencyName}\t${student.emergencyAddress}\t${student.emergencyNumber}\nGRADE ${student.grade}\t${student.lrn}\t${student.fullName}\t${student.emergencyName}\t${student.emergencyAddress}\t${student.emergencyNumber}`;

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
          <Button onClick={copyAllData}>Copy All Data</Button>
          <Button onClick={bulkDownloadPhotos}>Download All Pictures</Button>
          <Button onClick={bulkDownloadSignatures}>
            Download All Signatures
          </Button>
        </div>
      </Container>
      <Container>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="">LRN</TableHead>
              <TableHead
                className="group flex cursor-pointer items-center justify-between hover:bg-neutral-200"
                onClick={() => {
                  if (sortBy === null || sortBy === "desc") {
                    setSortBy("asc");
                    setSortedStudents(
                      students.sort((a, b) => {
                        if (a.fullName! < b.fullName!) {
                          return -1; // a comes before b
                        }
                        if (a.fullName! > b.fullName!) {
                          return 1; // a comes after b
                        }
                        return 0; // a and b are equal
                      }),
                    );
                  } else if (sortBy === "asc") {
                    setSortBy("desc");
                    setSortedStudents(
                      students.sort((b, a) => {
                        if (a.fullName! < b.fullName!) {
                          return -1; // a comes before b
                        }
                        if (a.fullName! > b.fullName!) {
                          return 1; // a comes after b
                        }
                        return 0; // a and b are equal
                      }),
                    );
                  }
                }}
              >
                <span>Full Name</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-center group-hover:bg-neutral-300">
                  {sortBy === "asc" ? (
                    <ArrowUpAz size={15} />
                  ) : sortBy === "desc" ? (
                    <ArrowDownZa size={15} />
                  ) : (
                    <ArrowUpDown size={15} />
                  )}
                </span>
              </TableHead>
              <TableHead className="">Grade</TableHead>
              <TableHead className="">Section</TableHead>
              <TableHead className="">Emergency Name</TableHead>
              <TableHead className="">Emergency Number</TableHead>
              <TableHead className="">Emergency Address</TableHead>
              <TableHead>Printed</TableHead>
              <TableHead className="text-center">Is Printed</TableHead>
              <TableHead className="text-center">Copy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student) => {
              let a = student.isPrinted;
              return (
                <TableRow key={student.id}>
                  <TableCell>{student.lrn}</TableCell>
                  <TableCell>{student.fullName}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.emergencyName}</TableCell>
                  <TableCell>{student.emergencyNumber}</TableCell>
                  <TableCell>{student.emergencyAddress}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      className={cn(
                        a &&
                          "border border-green-300 bg-green-200 hover:bg-green-500",
                        !a &&
                          "border border-red-300 bg-red-200 hover:bg-red-500",
                      )}
                      onClick={async () => {
                        a = !a;
                        mutate({
                          id: student.id,
                          printStatus: student.isPrinted!,
                        });
                      }}
                    ></Button>
                  </TableCell>
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
                    <Button
                      className={cn({
                        "bg-green-800 hover:bg-green-800": state.get(
                          String(student.id),
                        ),
                      })}
                      onClick={async () => {
                        addOrUpdate(String(student.id));
                        await handleCopy(student);
                      }}
                    >
                      Copy
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}
