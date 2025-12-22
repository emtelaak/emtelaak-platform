import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getFundraiserProperties,
  getFundraiserInvestmentStats,
  getFundraiserPropertyPerformance,
  getFundraiserRecentInvestors,
} from "../db/fundraiserDb";
import { getDb } from "../db";
import { storagePut } from "../storage";

/**
 * Fundraiser-only procedure
 * Ensures the user has fundraiser or admin role
 */
const fundraiserProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "fundraiser" && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Fundraiser role required.",
    });
  }
  return next({ ctx });
});

export const fundraiserRouter = router({
  /**
   * Get fundraiser dashboard overview stats
   */
  getDashboardStats: fundraiserProcedure.query(async ({ ctx }) => {
    const fundraiserId = ctx.user.id;
    
    const [properties, investmentStats] = await Promise.all([
      getFundraiserProperties(fundraiserId),
      getFundraiserInvestmentStats(fundraiserId),
    ]);

    return {
      totalProperties: properties.length,
      activeProperties: properties.filter((p) => p.status === "available").length,
      fundedProperties: properties.filter((p) => p.status === "funded").length,
      ...investmentStats,
    };
  }),

  /**
   * Get all properties managed by fundraiser
   */
  getProperties: fundraiserProcedure.query(async ({ ctx }) => {
    return await getFundraiserProperties(ctx.user.id);
  }),

  /**
   * Get detailed property performance
   */
  getPropertyPerformance: fundraiserProcedure.query(async ({ ctx }) => {
    return await getFundraiserPropertyPerformance(ctx.user.id);
  }),

  /**
   * Get recent investors
   */
  getRecentInvestors: fundraiserProcedure.query(async ({ ctx }) => {
    return await getFundraiserRecentInvestors(ctx.user.id, 10);
  }),

  /**
   * Submit a new property for approval
   * Status will be set to 'pending_approval' for admin review
   */
  submitProperty: fundraiserProcedure
    .input(
      z.object({
        name: z.string().min(1),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        propertyType: z.string(),
        investmentType: z.string(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        propertySize: z.number().optional(),
        numberOfUnits: z.number().optional(),
        constructionYear: z.number().optional(),
        totalValue: z.number(),
        sharePrice: z.number(),
        totalShares: z.number(),
        minimumInvestment: z.number().optional(),
        rentalYield: z.number().optional(),
        distributionFrequency: z.string().optional(),
        fundTermMonths: z.number().optional(),
        expectedAppreciation: z.number().optional(),
        images: z
          .array(
            z.object({
              imageData: z.string(),
              mimeType: z.string(),
              caption: z.string().optional(),
              captionAr: z.string().optional(),
              isPrimary: z.boolean(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { properties, propertyMedia } = await import("../../drizzle/schema");

      const { images, ...propertyData } = input;

      // Calculate available values
      const availableValue = propertyData.totalValue;
      const availableShares = propertyData.totalShares;

      // Create property with pending_approval status
      const [result] = await db.insert(properties).values({
        ...propertyData,
        availableValue,
        availableShares,
        fundraiserId: ctx.user.id,
        status: "pending_approval", // Requires admin approval
      });

      const propertyId = Number(result.insertId);

      // Upload and save images if provided
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];

          // Convert base64 to buffer
          const base64Data = image.imageData.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          // Generate unique filename
          const fileExtension = image.mimeType.split("/")[1];
          const fileName = `property-${propertyId}-${Date.now()}-${i}.${fileExtension}`;

          // Upload to S3
          const { url, key } = await storagePut(fileName, buffer, image.mimeType);

          // Save media record
          await db.insert(propertyMedia).values({
            propertyId,
            mediaType: "image" as const,
            fileUrl: url,
            fileKey: key,
            caption: image.caption || null,
            isFeatured: image.isPrimary || false,
            displayOrder: i,
          });
        }
      }

      return { propertyId, success: true };
    }),
});
