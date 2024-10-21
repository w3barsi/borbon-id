"use client";

import { Input } from "~/components/input-overlap";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import React, { useEffect, useState, type FormEvent } from "react";

export function CreateStudentDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create New Student</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Student ID</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <CreateStudentForm setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
}

function CreateStudentForm({
  setIsOpen,
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [fullName, setFullName] = useState("");
  const [lrn, setLrn] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sections, setSections] = useState<string[]>();
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [emergencyAddress, setEmergencyAddress] = useState("");

  const utils = api.useUtils();
  const { mutate } = api.student.createStudent.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
      setIsOpen(false);
    },
  });

  useEffect(() => {
    if (gradeLevel === "7") {
      setSections(["ANEMONE", "FUSCHIA", "PEONY", "PERWINKLE"]);
    } else if (gradeLevel === "8") {
      setSections(["ATHENA", "HERA", "PERSEPHONE", "THALIA"]);
    } else if (gradeLevel === "9") {
      setSections(["AMIABILITY", "JUSTICE", "MEEKNESS"]);
    } else if (gradeLevel === "10") {
      setSections([
        "ST. CAMILUS",
        "ST. CECILIA",
        "ST. CLAIRE",
        "ST. MARTHA",
        "ST. THERESE",
      ]);
    } else if (gradeLevel === "11") {
      setSections(["ABM", "COOKERY", "ICT", "HUMSS"]);
    } else if (gradeLevel === "12") {
      setSections(["ABM", "COOKERY", "ICT", "HUMSS"]);
    }
  }, [gradeLevel]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const student = {
      fullName,
      lrn,
      grade: Number(gradeLevel),
      section: sections,
      emergencyName,
      emergencyNumber,
      emergencyAddress,
    };
    mutate({ ...student });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex w-full flex-col gap-4">
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          >
            Full Name
          </Input>
          <Input
            type="text"
            value={lrn}
            onChange={(e) => setLrn(e.target.value)}
          >
            LRN
          </Input>
          <div className="flex w-full gap-2">
            <div className="w-1/2">
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <Label>Section</Label>
              <Select
                disabled={sections === undefined || sections.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {sections?.map((section) => (
                    <SelectItem value={section} key={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            type="text"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
          >
            Emergency Name
          </Input>
          <Input
            type="text"
            value={emergencyNumber}
            onChange={(e) => setEmergencyNumber(e.target.value)}
          >
            Emergency Number
          </Input>
          <Input
            type="text"
            value={emergencyAddress}
            onChange={(e) => setEmergencyAddress(e.target.value)}
          >
            Emergency Address
          </Input>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500"
          >
            Create
          </Button>
        </div>
      </form>
    </div>
  );
}
