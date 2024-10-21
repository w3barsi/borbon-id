import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { studentsTable } from "~/server/db/schema";
import { z } from "zod";

export const studentRouter = createTRPCRouter({
  getStudents: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.studentsTable.findMany({
      with: {
        signature: true,
        picture: true,
      },
      orderBy: (studentsTable, { desc }) => desc(studentsTable.createdAt),
    });
  }),
  createStudent: protectedProcedure
    .input(
      z.object({
        fullName: z.string().optional(), // Optional string
        lrn: z.string().optional(), // Optional string
        gradeLevel: z.string().optional(), // Optional string (change to `z.number().optional()` if it’s a number)
        sections: z.array(z.string()).optional(), // Optional array of strings
        emergencyName: z.string().optional(), // Optional string
        emergencyNumber: z.string().optional(), // Optional string
        emergencyAddress: z.string().optional(), // Optional string
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(studentsTable).values({
        ...input,
        createdById: ctx.session.id,
        createdByName: `${ctx.session.firstName} ${ctx.session.lastName}`,
      });
    }),
});
