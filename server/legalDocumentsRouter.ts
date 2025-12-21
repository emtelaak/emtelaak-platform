import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { legalDocuments, legalDocumentAcceptances } from "../drizzle/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import puppeteer from "puppeteer";
import crypto from "crypto";

// PDF Generation Helper
async function generatePDF(htmlContent: string, documentName: string): Promise<{ url: string; key: string }> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set content with proper styling for PDF
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1 { font-size: 24px; margin-bottom: 20px; }
            h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
            h3 { font-size: 18px; margin-top: 25px; margin-bottom: 10px; }
            p { margin-bottom: 15px; }
            ul, ol { margin-bottom: 15px; padding-left: 30px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <div class="footer">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Document: ${documentName}</p>
          </div>
        </body>
      </html>
    `;

    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    // Upload to S3
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const fileKey = `legal-documents/${documentName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${randomSuffix}.pdf`;
    const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');

    return { url, key: fileKey };
  } finally {
    await browser.close();
  }
}

export const legalDocumentsRouter = router({
  // List all legal documents with optional filters
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.enum([
          "terms_of_service",
          "privacy_policy",
          "investment_agreement",
          "shareholder_agreement",
          "subscription_agreement",
          "risk_disclosure",
          "kyc_consent",
          "other"
        ]).optional(),
        isPublished: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const query = db.select().from(legalDocuments);

      // Apply filters
      const conditions = [];
      if (input?.search) {
        conditions.push(
          or(
            like(legalDocuments.name, `%${input.search}%`),
            like(legalDocuments.slug, `%${input.search}%`)
          )
        );
      }
      if (input?.category) {
        conditions.push(eq(legalDocuments.category, input.category));
      }
      if (input?.isPublished !== undefined) {
        conditions.push(eq(legalDocuments.isPublished, input.isPublished ? 1 : 0));
      }

      const documents = conditions.length > 0
        ? await query.where(and(...conditions) as any).orderBy(desc(legalDocuments.updatedAt))
        : await query.orderBy(desc(legalDocuments.updatedAt));
      
      return documents;
    }),

  // Get single document by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const document = await db
        .select()
        .from(legalDocuments)
        .where(eq(legalDocuments.id, input.id))
        .limit(1);

      if (!document[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      return document[0];
    }),

  // Get document by slug (for public access)
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const document = await db
        .select()
        .from(legalDocuments)
        .where(
          and(
            eq(legalDocuments.slug, input.slug),
            eq(legalDocuments.isPublished, 1)
          ) as any
        )
        .limit(1);

      if (!document[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      return document[0];
    }),

  // Create new document (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        category: z.enum([
          "terms_of_service",
          "privacy_policy",
          "investment_agreement",
          "shareholder_agreement",
          "subscription_agreement",
          "risk_disclosure",
          "kyc_consent",
          "other"
        ]),
        version: z.string().min(1).max(50),
        htmlContent: z.string().min(1),
        variables: z.string().optional(),
        isActive: z.boolean().default(true),
        isPublished: z.boolean().default(false),
        effectiveDate: z.date().optional(),
        expiryDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(legalDocuments).values({
        ...input,
        isActive: input.isActive ? 1 : 0,
        isPublished: input.isPublished ? 1 : 0,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });

      return {
        success: true,
        // @ts-expect-error - insertId exists
        id: result.insertId,
      };
    }),

  // Update existing document (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        slug: z.string().min(1).max(200).optional(),
        category: z.enum([
          "terms_of_service",
          "privacy_policy",
          "investment_agreement",
          "shareholder_agreement",
          "subscription_agreement",
          "risk_disclosure",
          "kyc_consent",
          "other"
        ]).optional(),
        version: z.string().min(1).max(50).optional(),
        htmlContent: z.string().min(1).optional(),
        variables: z.string().optional(),
        isActive: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        effectiveDate: z.date().optional(),
        expiryDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updateData } = input;

      // Convert booleans to tinyint
      const processedData: any = { ...updateData };
      if (updateData.isActive !== undefined) {
        processedData.isActive = updateData.isActive ? 1 : 0;
      }
      if (updateData.isPublished !== undefined) {
        processedData.isPublished = updateData.isPublished ? 1 : 0;
      }
      processedData.updatedBy = ctx.user.id;

      await db
        .update(legalDocuments)
        .set(processedData)
        .where(eq(legalDocuments.id, id));

      return { success: true };
    }),

  // Delete document (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(legalDocuments)
        .where(eq(legalDocuments.id, input.id));

      return { success: true };
    }),

  // Generate PDF for document
  generatePDF: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const document = await db
        .select()
        .from(legalDocuments)
        .where(eq(legalDocuments.id, input.id))
        .limit(1);

      if (!document[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const doc = document[0];
      
      // Generate PDF
      const { url, key } = await generatePDF(doc.htmlContent, doc.name);

      // Update document with PDF URL
      await db
        .update(legalDocuments)
        .set({ pdfUrl: url })
        .where(eq(legalDocuments.id, input.id));

      return {
        success: true,
        pdfUrl: url,
      };
    }),

  // Record user acceptance of a document
  acceptDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        documentVersion: z.string(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(legalDocumentAcceptances).values({
        userId: ctx.user.id,
        documentId: input.documentId,
        documentVersion: input.documentVersion,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });

      return { success: true };
    }),

  // Get user's document acceptances
  getUserAcceptances: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const acceptances = await db
        .select()
        .from(legalDocumentAcceptances)
        .where(eq(legalDocumentAcceptances.userId, ctx.user.id))
        .orderBy(desc(legalDocumentAcceptances.acceptedAt));

      return acceptances;
    }),

  // Duplicate document (admin only)
  duplicate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const document = await db
        .select()
        .from(legalDocuments)
        .where(eq(legalDocuments.id, input.id))
        .limit(1);

      if (!document[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const original = document[0];
      const result = await db.insert(legalDocuments).values({
        name: `${original.name} (Copy)`,
        slug: `${original.slug}-copy-${Date.now()}`,
        category: original.category,
        version: original.version,
        htmlContent: original.htmlContent,
        variables: original.variables,
        isActive: 0, // Duplicates start as inactive
        isPublished: 0, // Duplicates start as unpublished
        effectiveDate: original.effectiveDate,
        expiryDate: original.expiryDate,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });

      return {
        success: true,
        // @ts-expect-error - insertId exists
        id: result.insertId,
      };
    }),
});
