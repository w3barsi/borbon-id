import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { pictures, signatures } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "32MB" } })
    .input(z.object({ id: z.number(), for: z.enum(["picture", "signature"]) }))
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const user = auth();

      // If you throw, the user will not be able to upload
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const input = metadata.input;

      if (input.for === "picture") {
        await db.delete(pictures).where(eq(pictures.studentId, input.id));
        await db.insert(pictures).values({
          type: file.type,
          key: file.key,
          url: file.url,
          name: file.name,
          studentId: input.id,
        });
      } else if (input.for === "signature") {
        await db.delete(signatures).where(eq(signatures.studentId, input.id));
        await db.insert(signatures).values({
          type: file.type,
          key: file.key,
          url: file.url,
          name: file.name,
          studentId: input.id,
        });
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
