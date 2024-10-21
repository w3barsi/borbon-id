"use client";

import { Input } from "~/components/input-overlap";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";

type EditStudentDialog = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  user: {
    id: number | null;
  };
};

export default function EditStudentDialog(props: EditStudentDialog) {
  const [id, setId] = useState(props.user.id);
  const utils = api.useUtils();

  const {
    mutate: getStudent,
    data: studentData,
    isPending,
  } = api.student.getStudent.useMutation();
  const { mutate: editStudent } = api.student.editStudent.useMutation({
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
      props.setIsOpen(false);
    },
  });

  const [sections, setSections] = useState<string[]>();

  const [student, setStudent] = useState<{
    fullName: string;
    lrn: string;
    gradeLevel: string;
    section: string;
    emergencyName: string;
    emergencyNumber: string;
    emergencyAddress: string;
  }>({
    fullName: "",
    lrn: "",
    gradeLevel: "",
    section: "",
    emergencyName: "",
    emergencyNumber: "",
    emergencyAddress: "",
  });

  useEffect(() => {
    setStudent({
      emergencyName: studentData?.emergencyName ?? "",
      emergencyNumber: studentData?.emergencyNumber ?? "",
      emergencyAddress: studentData?.emergencyAddress ?? "",
      fullName: studentData?.fullName ?? "",
      section: studentData?.section ?? "",
      lrn: studentData?.section ?? "",
      gradeLevel: String(studentData?.grade) ?? "",
    });
  }, [studentData]);

  useEffect(() => {
    setId(props.user.id);
  }, [props.user.id]);

  useEffect(() => {
    if (id === null) return;
    getStudent({ id });
  }, [id, getStudent]);

  useEffect(() => {
    if (student.gradeLevel === "7") {
      setSections(["ANEMONE", "FUSCHIA", "PEONY", "PERWINKLE"]);
    } else if (student.gradeLevel === "8") {
      setSections(["ATHENA", "HERA", "PERSEPHONE", "THALIA"]);
    } else if (student.gradeLevel === "9") {
      setSections(["AMIABILITY", "JUSTICE", "MEEKNESS"]);
    } else if (student.gradeLevel === "10") {
      setSections([
        "ST. CAMILUS",
        "ST. CECILIA",
        "ST. CLAIRE",
        "ST. MARTHA",
        "ST. THERESE",
      ]);
    } else if (student.gradeLevel === "11") {
      setSections(["ABM", "COOKERY", "ICT", "HUMSS"]);
    } else if (student.gradeLevel === "12") {
      setSections(["ABM", "COOKERY", "ICT", "HUMSS"]);
    }
  }, [student.gradeLevel]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    editStudent({ ...student, id });
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(b) => {
        props.setIsOpen(b);
        if (b === false) {
          setId(null);
        }
      }}
    >
      <DialogContent>
        {isPending ? (
          <div>Loading data...</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
            </DialogHeader>
            <DialogDescription></DialogDescription>

            <div>
              <form onSubmit={handleSubmit}>
                <div className="flex w-full flex-col gap-4">
                  <Input
                    type="text"
                    value={student.fullName}
                    onChange={(e) =>
                      setStudent((s) => ({ ...s, fullName: e.target.value }))
                    }
                  >
                    Full Name
                  </Input>
                  <Input
                    type="text"
                    value={student.lrn}
                    onChange={(e) =>
                      setStudent((s) => ({ ...s, lrn: e.target.value }))
                    }
                  >
                    LRN
                  </Input>
                  <div className="flex w-full gap-2">
                    <div className="w-1/2">
                      <Label>Grade Level</Label>
                      <Select
                        value={student.gradeLevel}
                        onValueChange={(v) =>
                          setStudent((s) => ({ ...s, gradeLevel: v }))
                        }
                      >
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
                        value={student.section}
                        onValueChange={(v) =>
                          setStudent((s) => ({ ...s, section: v }))
                        }
                        disabled={
                          sections === undefined || sections.length === 0
                        }
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
                    value={student.emergencyName}
                    onChange={(e) =>
                      setStudent((s) => ({
                        ...s,
                        emergencyName: e.target.value,
                      }))
                    }
                  >
                    Emergency Name
                  </Input>
                  <Input
                    type="text"
                    value={student.emergencyNumber}
                    onChange={(e) =>
                      setStudent((s) => ({
                        ...s,
                        emergencyNumber: e.target.value,
                      }))
                    }
                  >
                    Emergency Number
                  </Input>
                  <Input
                    type="text"
                    value={student.emergencyAddress}
                    onChange={(e) =>
                      setStudent((s) => ({
                        ...s,
                        emergencyAddress: e.target.value,
                      }))
                    }
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
