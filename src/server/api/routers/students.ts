import { clerkClient } from "@clerk/nextjs/server";
import { type Student } from "~/app/columns";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filesTable, studentsTable } from "~/server/db/schema";
import { aliasedTable, eq } from "drizzle-orm";
import { z } from "zod";

export const studentRouter = createTRPCRouter({
  getStudents: protectedProcedure.query(async ({ ctx }) => {
    // const signatureTable = aliasedTable(filesTable, "signature")
    // const pictureTable = aliasedTable(filesTable, "picture")
    // const students = await ctx.db
    //   .select()
    //   .from(studentsTable)
    //   .leftJoin(pictureTable, eq(studentsTable.pictureKey, pictureTable.key))
    //   .leftJoin(signatureTable, eq(studentsTable.signatureKey, signatureTable.key))

    return ctx.db.query.studentsTable.findMany({
      with: {
        signature: true,
        picture: true,
      },
    });
  }),
});
