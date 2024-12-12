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
import { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { saveAs } from "file-saver";

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

  const downloadAllPhotos = () => {
    const links: PhotoDownload[] = [];
    students.forEach((student) => {
      links.push({
        name: student.fullName!,
        url: student.picture?.url,
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    links.map(async (a) => {
      try {
        if (a.url) {
          const res = await fetch(a.url);
          if (!res.ok) throw new Error("Network response was not ok");
          const blob = await res.blob();
          const fileName = a.name.replaceAll(".", " ").replaceAll(" ", " ");
          saveAs(blob, `${fileName}_PIC`);
        }
      } catch (e) {
        console.error(e);
      }
    });
  };
  const downloadAllSignatures = () => {
    const links: PhotoDownload[] = [];
    students.forEach((student) => {
      links.push({
        name: student.fullName!,
        url: student.signature?.url,
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    links.map(async (a) => {
      try {
        if (a.url) {
          const res = await fetch(a.url);
          if (!res.ok) throw new Error("Network response was not ok");
          const blob = await res.blob();
          const fileName = a.name.replaceAll(".", " ").replaceAll(" ", " ");
          saveAs(blob, `${fileName}_SIG`);
        }
      } catch (e) {
        console.error(e);
      }
    });
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
