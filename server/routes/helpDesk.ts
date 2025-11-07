/**
 * Help Desk tRPC Router
 * Handles tickets, chat, knowledge base, and canned responses
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createSupportTicket,
  getTicketById,
  getUserTickets,
  getAllTickets,
  updateTicketStatus,
  assignTicket,
  addTicketMessage,
  getTicketMessages,
  rateTicket,
  getOrCreateChatConversation,
  getChatConversation,
  getAgentConversations,
  sendChatMessage,
  getChatMessages,
  assignConversation,
  markMessagesAsRead,
  closeChatConversation,
  getKnowledgeBaseCategories,
  getArticlesByCategory,
  getArticleBySlug,
  searchKnowledgeBase,
  incrementArticleViews,
  voteArticleHelpful,
  getPopularArticles,
  getRelatedArticles,
  getCannedResponses,
  getCannedResponseByShortcut,
  incrementCannedResponseUsage,
  getHelpDeskStats,
  getTicketCategories,
} from "../helpDeskDb";
import { autoTranslateMessage } from "../_core/translation";

// Admin/Agent procedure
const agentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Agent access required" });
  }
  return next({ ctx });
});

export const helpDeskRouter = router({
  // ============================================
  // TICKETS
  // ============================================
  tickets: router({
    // Create new ticket
    create: protectedProcedure
      .input(z.object({
        subject: z.string().min(5).max(255),
        description: z.string().min(10),
        categoryId: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        departmentType: z.enum(["customer_support", "technical", "billing", "kyc", "investment", "internal"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return createSupportTicket({
          userId: ctx.user.id,
          subject: input.subject,
          description: input.description,
          categoryId: input.categoryId,
          priority: input.priority,
          departmentType: input.departmentType,
          status: "open",
          source: "web",
        });
      }),

    // Get user's tickets
    getMyTickets: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getUserTickets(ctx.user.id, input.status);
      }),

    // Get ticket by ID
    getById: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ ctx, input }) => {
        const ticket = await getTicketById(input.ticketId);
        
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        // Check if user owns the ticket or is an agent
        if (
          ticket.ticket.userId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return ticket;
      }),

    // Get all tickets (agents only)
    getAll: agentProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        assignedToId: z.number().optional(),
        departmentType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getAllTickets(input);
      }),

    // Add message to ticket
    addMessage: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1),
        isInternal: z.boolean().default(false),
        attachments: z.array(z.object({
          url: z.string(),
          filename: z.string(),
          size: z.number(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user has access to this ticket
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        if (
          ticket.ticket.userId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        // Customers cannot add internal notes
        if (input.isInternal && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot add internal notes" });
        }

        return addTicketMessage({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isInternal: input.isInternal,
          attachments: input.attachments,
        });
      }),

    // Get ticket messages
    getMessages: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        includeInternal: z.boolean().default(false),
      }))
      .query(async ({ ctx, input }) => {
        // Verify user has access to this ticket
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        if (
          ticket.ticket.userId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        // Only agents can see internal notes
        const includeInternal = input.includeInternal && 
          (ctx.user.role === "admin" || ctx.user.role === "super_admin");

        return getTicketMessages(input.ticketId, includeInternal);
      }),

    // Update ticket status (agents only)
    updateStatus: agentProcedure
      .input(z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "waiting_customer", "waiting_internal", "resolved", "closed"]),
      }))
      .mutation(async ({ input }) => {
        const updates: any = {};
        
        if (input.status === "resolved") {
          updates.resolvedAt = new Date();
        } else if (input.status === "closed") {
          updates.closedAt = new Date();
        }

        await updateTicketStatus(input.ticketId, input.status, updates);
        return { success: true };
      }),

    // Assign ticket (agents only)
    assign: agentProcedure
      .input(z.object({
        ticketId: z.number(),
        agentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await assignTicket(input.ticketId, input.agentId);
        
        // Set first response time if not set
        const ticket = await getTicketById(input.ticketId);
        if (ticket && !ticket.ticket.firstResponseAt) {
          await updateTicketStatus(input.ticketId, ticket.ticket.status, {
            firstResponseAt: new Date(),
          });
        }

        return { success: true };
      }),

    // Rate ticket
    rate: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the ticket
        const ticket = await getTicketById(input.ticketId);
        if (!ticket || ticket.ticket.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        await rateTicket(input.ticketId, input.rating, input.feedback);
        return { success: true };
      }),

    // Get categories
    getCategories: publicProcedure
      .input(z.object({
        departmentType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getTicketCategories(input.departmentType);
      }),
  }),

  // ============================================
  // CHAT
  // ============================================
  chat: router({
    // Start or get existing conversation
    startConversation: protectedProcedure
      .input(z.object({
        departmentType: z.enum(["customer_support", "technical", "billing", "kyc", "investment", "internal"]).default("customer_support"),
      }))
      .mutation(async ({ ctx, input }) => {
        return getOrCreateChatConversation(ctx.user.id, input.departmentType);
      }),

    // Get conversation
    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await getChatConversation(input.conversationId);
        
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        // Check if user owns the conversation or is an agent
        if (
          conversation.conversation.userId !== ctx.user.id &&
          conversation.conversation.assignedAgentId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return conversation;
      }),

    // Get agent conversations
    getAgentConversations: agentProcedure
      .input(z.object({
        status: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getAgentConversations(ctx.user.id, input.status);
      }),

    // Get all waiting conversations (for assignment)
    getWaitingConversations: agentProcedure
      .query(async () => {
        return getAgentConversations(undefined, "waiting");
      }),

    // Send message
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string().min(1),
        messageType: z.enum(["text", "file", "system"]).default("text"),
        attachments: z.array(z.object({
          url: z.string(),
          filename: z.string(),
          size: z.number(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user has access to this conversation
        const conversation = await getChatConversation(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        if (
          conversation.conversation.userId !== ctx.user.id &&
          conversation.conversation.assignedAgentId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        // Auto-translate the message if it's text
        let translationData = null;
        if (input.messageType === "text") {
          try {
            translationData = await autoTranslateMessage(input.message);
          } catch (error) {
            console.error("[Chat] Translation failed:", error);
            // Continue without translation on error
          }
        }

        return sendChatMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          message: input.message,
          messageType: input.messageType,
          attachments: input.attachments,
          isRead: false,
          detectedLanguage: translationData?.detectedLanguage,
          translations: translationData?.translations,
        });
      }),

    // Get messages
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        limit: z.number().default(100),
      }))
      .query(async ({ ctx, input }) => {
        // Verify user has access to this conversation
        const conversation = await getChatConversation(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        if (
          conversation.conversation.userId !== ctx.user.id &&
          conversation.conversation.assignedAgentId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return getChatMessages(input.conversationId, input.limit);
      }),

    // Assign conversation (agents only)
    assign: agentProcedure
      .input(z.object({
        conversationId: z.number(),
        agentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await assignConversation(input.conversationId, input.agentId);
        return { success: true };
      }),

    // Mark messages as read
    markAsRead: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markMessagesAsRead(input.conversationId, ctx.user.id);
        return { success: true };
      }),

    // Close conversation
    close: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        rating: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the conversation or is an agent
        const conversation = await getChatConversation(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        if (
          conversation.conversation.userId !== ctx.user.id &&
          ctx.user.role !== "admin" &&
          ctx.user.role !== "super_admin"
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        await closeChatConversation(input.conversationId, input.rating);
        return { success: true };
      }),
  }),

  // ============================================
  // KNOWLEDGE BASE
  // ============================================
  knowledgeBase: router({
    // Get categories
    getCategories: publicProcedure.query(async () => {
      return getKnowledgeBaseCategories();
    }),

    // Get articles by category
    getArticlesByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return getArticlesByCategory(input.categoryId);
      }),

    // Get article by slug
    getArticle: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getArticleBySlug(input.slug);
        
        if (!article || !article.article.isPublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }

        // Increment view count
        await incrementArticleViews(article.article.id);

        return article;
      }),

    // Search articles
    search: publicProcedure
      .input(z.object({ query: z.string().min(2) }))
      .query(async ({ input }) => {
        return searchKnowledgeBase(input.query);
      }),

    // Vote on article
    vote: publicProcedure
      .input(z.object({
        articleId: z.number(),
        isHelpful: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await voteArticleHelpful(input.articleId, input.isHelpful);
        return { success: true };
      }),

    // Get popular articles
    getPopular: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return getPopularArticles(input.limit);
      }),

    // Get related articles
    getRelated: publicProcedure
      .input(z.object({
        articleId: z.number(),
        categoryId: z.number(),
        limit: z.number().default(5),
      }))
      .query(async ({ input }) => {
        return getRelatedArticles(input.articleId, input.categoryId, input.limit);
      }),
  }),

  // ============================================
  // CANNED RESPONSES (Agents only)
  // ============================================
  cannedResponses: router({
    // Get all canned responses
    getAll: agentProcedure
      .input(z.object({
        categoryId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return getCannedResponses(input.categoryId);
      }),

    // Get by shortcut
    getByShortcut: agentProcedure
      .input(z.object({ shortcut: z.string() }))
      .query(async ({ input }) => {
        return getCannedResponseByShortcut(input.shortcut);
      }),

    // Use canned response
    use: agentProcedure
      .input(z.object({ responseId: z.number() }))
      .mutation(async ({ input }) => {
        await incrementCannedResponseUsage(input.responseId);
        return { success: true };
      }),
  }),

  // ============================================
  // STATISTICS
  // ============================================
  stats: router({
    // Get help desk statistics
    getStats: agentProcedure
      .input(z.object({
        departmentType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return getHelpDeskStats(input.departmentType);
      }),
  }),
});
