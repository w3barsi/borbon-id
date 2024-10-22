import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { pictures, signatures, students } from "~/server/db/schema";
import { utapi } from "~/server/uploadthing";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const studentRouter = createTRPCRouter({
  getStudents: protectedProcedure.query(async ({ ctx }) => {
    const data = ctx.db.query.students.findMany({
      orderBy: (students, { desc }) => [desc(students.createdAt)],
      with: {
        picture: true,
        signature: true,
      },
    });

    return data;
  }),

  getStudent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.query.students.findFirst({
        where: (students, { eq }) => eq(students.id, input.id),
        with: {
          picture: true,
          signature: true,
        },
      });
    }),
  createStudent: protectedProcedure
    .input(
      z.object({
        fullName: z.string().optional(), // Optional string
        lrn: z.string().optional(), // Optional string
        grade: z.number().optional(), // Optional string (change to `z.number().optional()` if it’s a number)
        section: z.string().optional(), // Optional array of strings
        emergencyName: z.string().optional(), // Optional string
        emergencyNumber: z.string().optional(), // Optional string
        emergencyAddress: z.string().optional(), // Optional string
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(students).values({
        fullName: input.fullName,
        lrn: input.lrn,
        grade: input.grade,
        section: input.section,
        emergencyName: input.emergencyName,
        emergencyNumber: input.emergencyNumber,
        emergencyAddress: input.emergencyAddress,
        createdById: ctx.session.id,
        createdByName: `${ctx.session.firstName}${ctx.session.lastName ? " " + ctx.session.lastName : ""}`,
      });
    }),
  editStudent: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fullName: z.string().optional(), // Optional string
        lrn: z.string().optional(), // Optional string
        grade: z.number().optional(), // Optional string (change to `z.number().optional()` if it’s a number)
        section: z.string().optional(), // Optional array of strings
        emergencyName: z.string().optional(), // Optional string
        emergencyNumber: z.string().optional(), // Optional string
        emergencyAddress: z.string().optional(), // Optional string
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(students)
        .set({ ...input })
        .where(eq(students.id, input.id));
    }),
  deleteUpload: protectedProcedure
    .input(z.object({ key: z.string(), for: z.enum(["picture", "signature"]) }))
    .mutation(async ({ ctx, input }) => {
      await utapi.deleteFiles(input.key);
      if (input.for === "picture") {
        return await ctx.db.delete(pictures).where(eq(pictures.key, input.key));
      } else {
        return await ctx.db
          .delete(signatures)
          .where(eq(signatures.key, input.key));
      }
    }),
  deleteStudent: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        sigKey: z.string().optional(),
        picKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.picKey && input.sigKey) {
        await utapi.deleteFiles([input.picKey, input.sigKey]);
      } else if (input.picKey && !input.sigKey) {
        await utapi.deleteFiles(input.picKey);
      } else if (!input.picKey && input.sigKey) {
        await utapi.deleteFiles(input.sigKey);
      }

      return await ctx.db.delete(students).where(eq(students.id, input.id));
    }),
});
