import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import { getMediaLibraryItems, addMediaLibraryItem, deleteMediaLibraryItem, updateMediaLibraryItem } from "./db";

export const mediaLibraryRouter = router({
  // List all media items
  list: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      search: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      return await getMediaLibraryItems(input);
    }),

  // Upload new media item
  upload: adminProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
      contentType: z.string(),
      title: z.string().optional(),
      altText: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { fileName, fileData, contentType, title, altText, tags } = input;
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData.split(',')[1], 'base64');
      const fileSize = buffer.length;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileKey = `media-library/${timestamp}-${randomStr}-${fileName}`;
      
      // Upload to S3
      const { storagePut } = await import('./storage');
      const { url } = await storagePut(fileKey, buffer, contentType);
      
      // Get image dimensions if it's an image
      let width: number | undefined;
      let height: number | undefined;
      
      if (contentType.startsWith('image/')) {
        try {
          const sharp = require('sharp');
          const metadata = await sharp(buffer).metadata();
          width = metadata.width;
          height = metadata.height;
        } catch (error) {
          console.error('Failed to get image dimensions:', error);
        }
      }
      
      // Save to database
      const mediaItem = await addMediaLibraryItem({
        fileName,
        fileKey,
        url,
        mimeType: contentType,
        fileSize,
        width,
        height,
        title: title || fileName,
        altText,
        tags: tags || [],
        uploadedBy: ctx.user.id,
      });
      
      return mediaItem;
    }),

  // Update media item metadata
  updateMetadata: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      altText: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await updateMediaLibraryItem(input.id, {
        title: input.title,
        altText: input.altText,
        tags: input.tags,
      });
    }),

  // Delete media item
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await deleteMediaLibraryItem(input.id);
    }),
});
