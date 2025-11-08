import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "./_core/trpc";
import { getPlatformContent, upsertPlatformContent } from "./db";

export const contentRouter = router({
  // Get content by key (public)
  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      return await getPlatformContent(input.key);
    }),

  // Update content (admin only)
  update: adminProcedure
    .input(
      z.object({
        key: z.string(),
        content: z.any(),
        contentAr: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await upsertPlatformContent({
        key: input.key,
        content: input.content,
        contentAr: input.contentAr,
        updatedBy: ctx.user.id,
      });
    }),

  // Image upload endpoint
  uploadImage: adminProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
      contentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { fileName, fileData, contentType } = input;
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData.split(',')[1], 'base64');
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileKey = `content-images/${timestamp}-${randomStr}-${fileName}`;
      
      // Upload to S3
      const { storagePut } = await import('./storage');
      const { url } = await storagePut(fileKey, buffer, contentType);
      
      return { url, fileKey };
    }),
});
