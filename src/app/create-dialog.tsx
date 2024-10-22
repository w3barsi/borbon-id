"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
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

export default function CreateStudentDialog() {
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
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

  const { mutate: createStudent } = api.student.createStudent.useMutation({
    onMutate: () => {
      setToastId(toast("Saving student records to the database."));
    },
    onSuccess: async () => {
      await utils.student.getStudents.invalidate();
      toast.success("Saved student records to the database.", {
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
    createStudent({ ...values });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-56">Create Student</Button>
      </DialogTrigger>
      <DialogContent>
        {isPending ? (
          <div>Loading student data...</div>
        ) : (
          <>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription></DialogDescription>
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
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
