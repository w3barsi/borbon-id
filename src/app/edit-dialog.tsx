"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { Trash } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type EditStudentDialog = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  user: {
    id: number;
  };
};
const formSchema = z.object({
  fullName: z.string().optional(),
  lrn: z.string().optional(),
  grade: z.coerce.number().optional(),
  section: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyNumber: z.string().optional(),
  emergencyAddress: z.string().optional(),
});

function formatDateTimeToMMDDYY(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

export default function EditStudentDialog(props: EditStudentDialog) {
  const utils = api.useUtils();
  const [toastId, setToastId] = useState<number | string>();

  const {
    data: student,
    mutate: getStudentData,
    isPending,
  } = api.student.getStudent.useMutation({
    onSuccess: (data) => {
      form.reset({
        lrn: data?.lrn ?? "",
        fullName: data?.fullName ?? "",
        grade: data?.grade ?? 0,
        section: data?.section ?? "",
        emergencyName: data?.emergencyName ?? "",
        emergencyNumber: data?.emergencyNumber ?? "",
        emergencyAddress: data?.emergencyAddress ?? "",
      });
    },
  });

  const { mutate: editStudent } = api.student.editStudent.useMutation({
    onMutate: () => {
      setToastId(toast("Saving changes to database."));
    },
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
      toast.success("Saved changes to database.", {
        id: toastId,
      });
    },
  });

  const { mutate: deleteStudent } = api.student.deleteStudent.useMutation({
    onMutate: () => {
      props.setIsOpen(false);
      setToastId(toast("Deleting student from database."));
    },
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
      toast.success("Deleted student from database.", {
        id: toastId,
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lrn: "",
      fullName: "",
      grade: 0,
      section: "",
      emergencyName: "",
      emergencyNumber: "",
      emergencyAddress: "",
    },
  });
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    editStudent({ ...values, id: props.user.id });
    props.setIsOpen(false);
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.setIsOpen}>
      <DialogContent
        onOpenAutoFocus={() => getStudentData({ id: props.user.id })}
      >
        {isPending ? (
          <div>Loading student data...</div>
        ) : (
          <>
            <DialogTitle>Edit Student</DialogTitle>
            {student ? (
              <DialogDescription>
                <p>Created at: <span className="font-bold">{formatDateTimeToMMDDYY(student?.createdAt)}</span></p>
                {student?.updatedAt &&
                  <p>Updated at: <span className="font-bold">{formatDateTimeToMMDDYY(student?.updatedAt)}</span></p>
                }
              </DialogDescription>
            ) : null}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lrn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LRN</FormLabel>
                      <FormControl>
                        <Input placeholder="LRN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Grade"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <FormControl>
                            <Input placeholder="Section" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="emergencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button type="submit" className="w-full">
                    Submit
                  </Button>
                  <Button
                    variant="destructive"
                    className="px-2"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteStudent({
                        id: props.user.id,
                        sigKey: student?.signature?.key,
                        picKey: student?.picture?.key,
                      });
                    }}
                  >
                    <Trash />
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
