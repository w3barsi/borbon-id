"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Container } from "~/components/container";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { useState } from "react";
import { toast } from "sonner";

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

  const { mutate: archive } = api.student.archive.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
    },
  });

  const [filter, setFilter] = useState<"new" | "all" | "archived">("new");

  const isStudentComplete = (student: GetStudentsOutputType) => {
    return (
      student.lrn &&
      student.fullName &&
      student.grade &&
      student.section &&
      student.emergencyName &&
      student.emergencyAddress &&
      student.emergencyNumber &&
      student.picture &&
      student.signature &&
      !student.isPrinted
    );
  };

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
    const filteredStudents = filter === "new" ? students.filter((s) => !s.isArchived) : students;
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

  const handleCopy = async (student: GetStudentsOutputType) => {
    console.log(student)
    const grade = (student.grade ?? "").toString().trim();
    const lrn = (student.lrn ?? "").trim();
    const fullName = (student.fullName ?? "").trim();
    const emergencyName = (student.emergencyName ?? "").trim();
    const emergencyAddress = (student.emergencyAddress ?? "").trim();
    const emergencyNumber = (student.emergencyNumber ?? "").trim();
    const data = `GRADE ${grade}	${lrn}	${fullName}	${emergencyName}	${emergencyAddress}	${emergencyNumber}`;

    await navigator.clipboard.writeText(data);
    toast.success("Copied student data to clipboard!");
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

    const filteredStudents = filter === "new" ? students.filter((s) => !s.isArchived) : students;

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

    const filteredStudents = filter === "new" ? students.filter((s) => !s.isArchived) : students;

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

  const download = async (
    pType: "signature" | "picture",
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
    if (pType === "picture") {
      saveAs(blob, `${fileName}_PIC`);
    } else {
      saveAs(blob, `${fileName}_SIG`);
    }
  };

  return (
    <div>
      <Container>
        <div className="flex items-center justify-between gap-2">
          <div
            id="tabs"
            className="flex gap-2 rounded-lg bg-neutral-200/50 p-1"
          >
            <Button
              onClick={() => setFilter("new")}
              className={cn(
                filter === "new"
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-transparent text-neutral-800 shadow-none hover:bg-neutral-400/20",
              )}
            >
              New Students
            </Button>
            <Button
              onClick={() => setFilter("all")}
              className={cn(
                filter === "all"
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-transparent text-neutral-800 shadow-none hover:bg-neutral-400/20",
              )}
            >
              All Students
            </Button>
            <Button
              onClick={() => setFilter("archived")}
              className={cn(
                filter === "archived"
                  ? "bg-black text-white hover:bg-black/90"
                  : "bg-transparent text-neutral-800 shadow-none hover:bg-neutral-400/20",
              )}
            >
              Archive
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyAllData}>Copy All Data</Button>
            <Button onClick={async () => toast.promise(bulkDownloadPhotos, {
              loading: "Preparing to download photos...",
              success: "Successfully downloaded photos!",
              error: "Failed to download signatures",
            })}>Download All Pictures</Button>
            <Button onClick={async () => toast.promise(bulkDownloadSignatures, {
              loading: "Preparing to download signatures...",
              success: "Successfully downloaded signatures!",
              error: "Failed to download signatures",
            })}>
              Download All Signatures
            </Button>
          </div>
        </div>
      </Container>
      <Container>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="">LRN</TableHead>
              <TableHead className="group flex cursor-pointer items-center justify-between hover:bg-neutral-200">
                <span>Full Name</span>
              </TableHead>
              <TableHead className="">Grade</TableHead>
              <TableHead className="">Section</TableHead>
              <TableHead className="">Emergency Name</TableHead>
              <TableHead className="">Emergency Number</TableHead>
              <TableHead className="">Emergency Address</TableHead>
              <TableHead>Printed</TableHead>
              <TableHead>Archived</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filter === "new"
              ? students
                  .filter((student) => !student.isArchived)
                  .map((student) => {
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
                            onClick={() => {
                              console.log(student.isArchived)
                              archive({
                                id: student.id,
                                archive: student.isArchived,
                              });
                            }}
                          >
                            Archive
                          </Button>
                        </TableCell>
                        <TableCell>{student.updatedAt?.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  isStudentComplete(student) &&
                                    "bg-green-400 hover:bg-green-500",
                                )}
                              >
                                <span className="sr-only">Open menu</span>
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  download(
                                    "picture",
                                    student.picture?.url,
                                    student.fullName,
                                  )
                                }
                                disabled={student.picture === null}
                              >
                                Download Photo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  download(
                                    "signature",
                                    student.signature?.url,
                                    student.fullName,
                                  )
                                }
                                disabled={student.signature === null}
                              >
                                Download Signature
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  addOrUpdate(String(student.id));
                                  await handleCopy(student);
                                }}
                              >
                                Copy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
              : null}
            {filter === "all"
              ? students.map((student) => {
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
                          onClick={() => {
                            archive({
                              id: student.id,
                              archive: student.isArchived,
                            });
                          }}
                        >
                          Archive
                        </Button>
                      </TableCell>
                      <TableCell>{student.createdAt?.toLocaleString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "h-8 w-8 p-0",
                                isStudentComplete(student) &&
                                  "bg-green-400 hover:bg-green-500",
                              )}
                            >
                              <span className="sr-only">Open menu</span>
                              <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                download(
                                  "picture",
                                  student.picture?.url,
                                  student.fullName,
                                )
                              }
                              disabled={student.picture === null}
                            >
                              Download Photo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                download(
                                  "signature",
                                  student.signature?.url,
                                  student.fullName,
                                )
                              }
                              disabled={student.signature === null}
                            >
                              Download Signature
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                addOrUpdate(String(student.id));
                                await handleCopy(student);
                              }}
                            >
                              Copy
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              : null}
            {filter === "archived"
              ? students
                  .filter((student) => student.isArchived)
                  .map((student) => {
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
                            onClick={() => {
                              archive({
                                id: student.id,
                                archive: student.isArchived,
                              });
                            }}
                          >
                            Archive
                          </Button>
                        </TableCell>
                        <TableCell>{student.updatedAt?.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  isStudentComplete(student) &&
                                    "bg-green-400 hover:bg-green-500",
                                )}
                              >
                                <span className="sr-only">Open menu</span>
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  download(
                                    "picture",
                                    student.picture?.url,
                                    student.fullName,
                                  )
                                }
                                disabled={student.picture === null}
                              >
                                Download Photo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  download(
                                    "signature",
                                    student.signature?.url,
                                    student.fullName,
                                  )
                                }
                                disabled={student.signature === null}
                              >
                                Download Signature
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  addOrUpdate(String(student.id));
                                  await handleCopy(student);
                                }}
                              >
                                Copy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
              : null}
          </TableBody>
        </Table>
      </Container>
    </div>
  );
}
