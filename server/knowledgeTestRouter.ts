import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { db } from "./db";
import { 
  knowledgeTestQuestions, 
  knowledgeTestAnswers, 
  knowledgeTestAttempts,
  knowledgeTestResponses 
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Knowledge Test Router
 * Handles FRA-accredited investment knowledge test
 */

export const knowledgeTestRouter = router({
  /**
   * Start a new knowledge test
   * Generates a random selection of questions
   */
  startTest: protectedProcedure
    .input(z.object({
      numberOfQuestions: z.number().min(10).max(50).default(20),
    }))
    .query(async ({ input }) => {
      // Get random questions from database
      // Mix of difficulties: 40% easy, 40% medium, 20% hard
      const easyCount = Math.floor(input.numberOfQuestions * 0.4);
      const mediumCount = Math.floor(input.numberOfQuestions * 0.4);
      const hardCount = input.numberOfQuestions - easyCount - mediumCount;

      const easyQuestions = await db
        .select()
        .from(knowledgeTestQuestions)
        .where(and(
          eq(knowledgeTestQuestions.difficulty, "easy"),
          eq(knowledgeTestQuestions.isActive, true)
        ))
        .orderBy(sql`RAND()`)
        .limit(easyCount);

      const mediumQuestions = await db
        .select()
        .from(knowledgeTestQuestions)
        .where(and(
          eq(knowledgeTestQuestions.difficulty, "medium"),
          eq(knowledgeTestQuestions.isActive, true)
        ))
        .orderBy(sql`RAND()`)
        .limit(mediumCount);

      const hardQuestions = await db
        .select()
        .from(knowledgeTestQuestions)
        .where(and(
          eq(knowledgeTestQuestions.difficulty, "hard"),
          eq(knowledgeTestQuestions.isActive, true)
        ))
        .orderBy(sql`RAND()`)
        .limit(hardCount);

      const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

      // Shuffle questions
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);

      // Get answers for each question
      const questionsWithAnswers = await Promise.all(
        shuffledQuestions.map(async (question) => {
          const answers = await db
            .select()
            .from(knowledgeTestAnswers)
            .where(eq(knowledgeTestAnswers.questionId, question.id));

          // Shuffle answers
          const shuffledAnswers = answers.sort(() => Math.random() - 0.5);

          return {
            ...question,
            answers: shuffledAnswers.map(({ isCorrect, ...answer }) => answer), // Don't send correct answer to client
          };
        })
      );

      return {
        questions: questionsWithAnswers,
        totalQuestions: questionsWithAnswers.length,
      };
    }),

  /**
   * Submit test and calculate score
   */
  submitTest: protectedProcedure
    .input(z.object({
      responses: z.array(z.object({
        questionId: z.number(),
        selectedAnswerId: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const { responses } = input;
      const userId = ctx.user.id;

      // Calculate score
      let correctAnswers = 0;
      const responseRecords = [];

      for (const response of responses) {
        const answer = await db
          .select()
          .from(knowledgeTestAnswers)
          .where(eq(knowledgeTestAnswers.id, response.selectedAnswerId))
          .limit(1);

        const isCorrect = answer[0]?.isCorrect || false;
        if (isCorrect) correctAnswers++;

        responseRecords.push({
          questionId: response.questionId,
          selectedAnswerId: response.selectedAnswerId,
          isCorrect,
        });
      }

      const totalQuestions = responses.length;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= 70; // 70% passing grade

      // Generate certificate ID if passed
      const certificateId = passed ? `KT-${uuidv4().substring(0, 8).toUpperCase()}` : null;

      // Calculate expiration date (2 years from now if passed)
      const expiresAt = passed ? new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) : null;

      // Create attempt record
      const [attempt] = await db
        .insert(knowledgeTestAttempts)
        .values({
          userId,
          score,
          totalQuestions,
          correctAnswers,
          passed,
          certificateId,
          expiresAt,
        })
        .$returningId();

      // Insert response records
      await db
        .insert(knowledgeTestResponses)
        .values(
          responseRecords.map((record) => ({
            attemptId: attempt.id,
            ...record,
          }))
        );

      return {
        attemptId: attempt.id,
        score,
        totalQuestions,
        correctAnswers,
        passed,
        certificateId,
        expiresAt,
      };
    }),

  /**
   * Get user's test history
   */
  getTestHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const attempts = await db
        .select()
        .from(knowledgeTestAttempts)
        .where(eq(knowledgeTestAttempts.userId, ctx.user.id))
        .orderBy(desc(knowledgeTestAttempts.attemptedAt));

      return attempts;
    }),

  /**
   * Get valid certificate
   */
  getCertificate: protectedProcedure
    .query(async ({ ctx }) => {
      const [certificate] = await db
        .select()
        .from(knowledgeTestAttempts)
        .where(and(
          eq(knowledgeTestAttempts.userId, ctx.user.id),
          eq(knowledgeTestAttempts.passed, true)
        ))
        .orderBy(desc(knowledgeTestAttempts.attemptedAt))
        .limit(1);

      if (!certificate) {
        return null;
      }

      // Check if expired
      if (certificate.expiresAt && new Date(certificate.expiresAt) < new Date()) {
        return null;
      }

      return certificate;
    }),

  /**
   * Get test result details
   */
  getTestResult: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const [attempt] = await db
        .select()
        .from(knowledgeTestAttempts)
        .where(and(
          eq(knowledgeTestAttempts.id, input.attemptId),
          eq(knowledgeTestAttempts.userId, ctx.user.id)
        ))
        .limit(1);

      if (!attempt) {
        throw new Error("Test attempt not found");
      }

      // Get detailed responses
      const responses = await db
        .select({
          response: knowledgeTestResponses,
          question: knowledgeTestQuestions,
          selectedAnswer: knowledgeTestAnswers,
        })
        .from(knowledgeTestResponses)
        .leftJoin(knowledgeTestQuestions, eq(knowledgeTestResponses.questionId, knowledgeTestQuestions.id))
        .leftJoin(knowledgeTestAnswers, eq(knowledgeTestResponses.selectedAnswerId, knowledgeTestAnswers.id))
        .where(eq(knowledgeTestResponses.attemptId, input.attemptId));

      return {
        attempt,
        responses,
      };
    }),

  // ============================================
  // ADMIN PROCEDURES
  // ============================================

  /**
   * Create a new question (admin only)
   */
  createQuestion: adminProcedure
    .input(z.object({
      questionText: z.string(),
      questionTextAr: z.string().optional(),
      category: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      answers: z.array(z.object({
        answerText: z.string(),
        answerTextAr: z.string().optional(),
        isCorrect: z.boolean(),
      })).min(2).max(6),
    }))
    .mutation(async ({ input }) => {
      const { answers, ...questionData } = input;

      // Insert question
      const [question] = await db
        .insert(knowledgeTestQuestions)
        .values(questionData)
        .$returningId();

      // Insert answers
      await db
        .insert(knowledgeTestAnswers)
        .values(
          answers.map((answer) => ({
            questionId: question.id,
            ...answer,
          }))
        );

      return { success: true, questionId: question.id };
    }),

  /**
   * List all questions (admin only)
   */
  listQuestions: adminProcedure
    .input(z.object({
      category: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    }))
    .query(async ({ input }) => {
      let query = db.select().from(knowledgeTestQuestions);

      if (input.category) {
        query = query.where(eq(knowledgeTestQuestions.category, input.category));
      }

      if (input.difficulty) {
        query = query.where(eq(knowledgeTestQuestions.difficulty, input.difficulty));
      }

      const questions = await query;

      // Get answers for each question
      const questionsWithAnswers = await Promise.all(
        questions.map(async (question) => {
          const answers = await db
            .select()
            .from(knowledgeTestAnswers)
            .where(eq(knowledgeTestAnswers.questionId, question.id));

          return {
            ...question,
            answers,
          };
        })
      );

      return questionsWithAnswers;
    }),

  /**
   * Update question (admin only)
   */
  updateQuestion: adminProcedure
    .input(z.object({
      id: z.number(),
      questionText: z.string().optional(),
      questionTextAr: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      await db
        .update(knowledgeTestQuestions)
        .set(updateData)
        .where(eq(knowledgeTestQuestions.id, id));

      return { success: true };
    }),

  /**
   * Delete question (admin only)
   */
  deleteQuestion: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db
        .delete(knowledgeTestQuestions)
        .where(eq(knowledgeTestQuestions.id, input.id));

      return { success: true };
    }),
});
