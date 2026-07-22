"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { GetStudentsOutputType } from "~/server/api/routers/students";
import { api } from "~/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

export function NoteDialog({
  student,
  open,
  onOpenChange,
}: {
  student: GetStudentsOutputType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const savedNote =
    student.adminNote?.trim() === "admin_note" ? "" : (student.adminNote ?? "");
  const [note, setNote] = useState(savedNote);
  const utils = api.useUtils();
  const { mutate, isPending } = api.student.setAdminNote.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.student.getStudents.invalidate();
      toast.success(variables.note.trim() ? "Note saved." : "Note cleared.");
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to save note."),
  });

  const save = (value: string) => mutate({ id: student.id, note: value });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setNote(savedNote);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notes from DARCYGRAPHiX</DialogTitle>
          <DialogDescription>
            Add a note for {student.fullName ?? "this student"}. All signed-in
            users can see it.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.ctrlKey && event.key === "Enter") {
              event.preventDefault();
              if (!isPending) save(note);
            }
          }}
          maxLength={2000}
          rows={7}
          placeholder="Enter a note for this student..."
          className="min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <div className="text-right text-xs text-muted-foreground">
          {note.length}/2000
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || !savedNote}
            onClick={() => {
              setNote("");
              save("");
            }}
          >
            Clear note
          </Button>
          <Button type="button" disabled={isPending} onClick={() => save(note)}>
            {isPending ? "Saving..." : "Save note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
