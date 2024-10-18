import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { fileUpload, student } from "~/server/db/schema";
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
      console.log("Middleware Reached");

      // If you throw, the user will not be able to upload
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!user) throw new UploadThingError("Unauthorized");
      console.log("Middleware Reached PART 2");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const input = metadata.input;

      try {
        await db.insert(fileUpload).values({
          for: "picture",
          key: file.key,
          type: file.type,
          url: file.url,
        });
      } catch (e) {
        console.error("Failed to insert file info into db", e);
      }

      if (input.for === "picture") {
        try {
          await db
            .update(student)
            .set({ pictureKey: file.key })
            .where(eq(student.id, input.id));
        } catch (e) {
          console.error("Failed to update student info", e);
        }
      } else {
        try {
          await db
            .update(student)
            .set({ signatureKey: file.key })
            .where(eq(student.id, input.id));
        } catch (e) {
          console.error("Failed to update student info", e);
        }
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
