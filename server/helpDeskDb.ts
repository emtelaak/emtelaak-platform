/**
 * Help Desk Database Helper Functions
 * Handles tickets, chat conversations, knowledge base, and canned responses
 */

import { eq, desc, and, or, like, sql, count, isNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  supportTickets,
  ticketMessages,
  ticketCategories,
  chatConversations,
  chatMessages,
  knowledgeBaseArticles,
  knowledgeBaseCategories,
  cannedResponses,
  users,
  type InsertSupportTicket,
  type InsertTicketMessage,
  type InsertChatConversation,
  type InsertChatMessage,
  type InsertKnowledgeBaseArticle,
  type InsertCannedResponse,
} from "../drizzle/schema";

// ============================================
// TICKET MANAGEMENT
// ============================================

/**
 * Generate unique ticket number
 */
export async function generateTicketNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const result = await db
    .select({ count: count() })
    .from(supportTickets)
    .where(like(supportTickets.ticketNumber, `TKT-${year}-%`));

  const ticketCount = result[0]?.count || 0;
  const nextNumber = String(ticketCount + 1).padStart(5, "0");
  return `TKT-${year}-${nextNumber}`;
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(ticket: Omit<InsertSupportTicket, "ticketNumber">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ticketNumber = await generateTicketNumber();
  
  const [newTicket] = await db.insert(supportTickets).values({
    ...ticket,
    ticketNumber,
  });

  return newTicket;
}

/**
 * Get ticket by ID with user and assigned agent info
 */
export async function getTicketById(ticketId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      ticket: supportTickets,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      assignedAgent: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      category: ticketCategories,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .leftJoin(users, eq(supportTickets.assignedToId, users.id))
    .leftJoin(ticketCategories, eq(supportTickets.categoryId, ticketCategories.id))
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  // Build WHERE conditions
  const conditions = [eq(supportTickets.userId, userId)];
  if (status) {
    conditions.push(eq(supportTickets.status, status as any));
  }
  const whereClause = and(...conditions);

  // Execute query with all conditions
  const query = db
    .select({
      ticket: supportTickets,
      category: ticketCategories,
      assignedAgent: {
        id: users.id,
        name: users.name,
      },
    })
    .from(supportTickets)
    .leftJoin(ticketCategories, eq(supportTickets.categoryId, ticketCategories.id))
    .leftJoin(users, eq(supportTickets.assignedToId, users.id));
  
  // Apply where clause if it exists
  return whereClause ? query.where(whereClause).orderBy(desc(supportTickets.createdAt)) : query.orderBy(desc(supportTickets.createdAt));
}

/**
 * Get all tickets (for agents/admins)
 */
export async function getAllTickets(filters?: {
  status?: string;
  priority?: string;
  assignedToId?: number;
  departmentType?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(supportTickets.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(supportTickets.priority, filters.priority as any));
  }
  if (filters?.assignedToId) {
    conditions.push(eq(supportTickets.assignedToId, filters.assignedToId));
  }
  if (filters?.departmentType) {
    conditions.push(eq(supportTickets.departmentType, filters.departmentType as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      ticket: supportTickets,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      category: ticketCategories,
      assignedAgent: {
        id: users.id,
        name: users.name,
      },
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .leftJoin(ticketCategories, eq(supportTickets.categoryId, ticketCategories.id))
    .leftJoin(users, eq(supportTickets.assignedToId, users.id));
  
  return whereClause ? query.where(whereClause).orderBy(desc(supportTickets.createdAt)) : query.orderBy(desc(supportTickets.createdAt));
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: number, status: string, updates?: {
  assignedToId?: number;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(supportTickets)
    .set({
      status: status as any,
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Assign ticket to agent
 */
export async function assignTicket(ticketId: number, agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(supportTickets)
    .set({
      assignedToId: agentId,
      status: "in_progress",
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(message: InsertTicketMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newMessage] = await db.insert(ticketMessages).values(message);

  // Update ticket's updatedAt timestamp
  await db
    .update(supportTickets)
    .set({ updatedAt: new Date() })
    .where(eq(supportTickets.id, message.ticketId));

  return newMessage;
}

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(ticketId: number, includeInternal: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(ticketMessages.ticketId, ticketId)];
  
  if (!includeInternal) {
    conditions.push(eq(ticketMessages.isInternal, false));
  }

  return db
    .select({
      message: ticketMessages,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(ticketMessages)
    .leftJoin(users, eq(ticketMessages.userId, users.id))
    .where(and(...conditions))
    .orderBy(ticketMessages.createdAt);
}

/**
 * Rate ticket (customer satisfaction)
 */
export async function rateTicket(ticketId: number, rating: number, feedback?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(supportTickets)
    .set({
      customerSatisfactionRating: rating,
      customerFeedback: feedback,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticketId));
}

// ============================================
// CHAT MANAGEMENT
// ============================================

/**
 * Generate unique conversation ID
 */
export async function generateConversationId(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const result = await db
    .select({ count: count() })
    .from(chatConversations)
    .where(like(chatConversations.conversationId, `CHAT-${year}-%`));

  const chatCount = result[0]?.count || 0;
  const nextNumber = String(chatCount + 1).padStart(5, "0");
  return `CHAT-${year}-${nextNumber}`;
}

/**
 * Create or get existing chat conversation for user
 */
export async function getOrCreateChatConversation(userId: number, departmentType: string = "customer_support") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check for existing active conversation
  const existing = await db
    .select()
    .from(chatConversations)
    .where(
      and(
        eq(chatConversations.userId, userId),
        or(
          eq(chatConversations.status, "waiting"),
          eq(chatConversations.status, "active")
        )
      )
    )
    .orderBy(desc(chatConversations.createdAt))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new conversation
  const conversationId = await generateConversationId();
  const [result] = await db.insert(chatConversations).values({
    conversationId,
    userId,
    departmentType: departmentType as any,
    status: "waiting",
    lastMessageAt: new Date(),
  }).$returningId();

  // Fetch the newly created conversation
  const [newConversation] = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.id, result.id))
    .limit(1);

  return newConversation;
}

/**
 * Get conversation by ID with messages
 */
export async function getChatConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      conversation: chatConversations,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      assignedAgent: {
        id: users.id,
        name: users.name,
      },
    })
    .from(chatConversations)
    .leftJoin(users, eq(chatConversations.userId, users.id))
    .leftJoin(users, eq(chatConversations.assignedAgentId, users.id))
    .where(eq(chatConversations.id, conversationId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all chat conversations for agent
 */
export async function getAgentConversations(agentId?: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (agentId) {
    conditions.push(eq(chatConversations.assignedAgentId, agentId));
  }
  if (status) {
    conditions.push(eq(chatConversations.status, status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      conversation: chatConversations,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      lastMessage: chatMessages,
    })
    .from(chatConversations)
    .leftJoin(users, eq(chatConversations.userId, users.id))
    .leftJoin(chatMessages, eq(chatConversations.id, chatMessages.conversationId));
  
  return whereClause ? query.where(whereClause).orderBy(desc(chatConversations.lastMessageAt)) : query.orderBy(desc(chatConversations.lastMessageAt));
}

/**
 * Send chat message
 */
export async function sendChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [newMessage] = await db.insert(chatMessages).values(message);

  // Update conversation's lastMessageAt
  await db
    .update(chatConversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(chatConversations.id, message.conversationId));

  return newMessage;
}

/**
 * Get chat messages for conversation
 */
export async function getChatMessages(conversationId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      message: chatMessages,
      sender: {
        id: users.id,
        name: users.name,
        role: users.role,
      },
    })
    .from(chatMessages)
    .leftJoin(users, eq(chatMessages.senderId, users.id))
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

/**
 * Assign conversation to agent
 */
export async function assignConversation(conversationId: number, agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(chatConversations)
    .set({
      assignedAgentId: agentId,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, conversationId));
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(chatMessages)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(chatMessages.conversationId, conversationId),
        sql`${chatMessages.senderId} != ${userId}`
      )
    );
}

/**
 * Close chat conversation
 */
export async function closeChatConversation(conversationId: number, rating?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(chatConversations)
    .set({
      status: "closed",
      closedAt: new Date(),
      customerSatisfactionRating: rating,
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, conversationId));
}

// ============================================
// KNOWLEDGE BASE
// ============================================

/**
 * Get all knowledge base categories
 */
export async function getKnowledgeBaseCategories() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      category: knowledgeBaseCategories,
      articleCount: count(knowledgeBaseArticles.id),
    })
    .from(knowledgeBaseCategories)
    .leftJoin(
      knowledgeBaseArticles,
      and(
        eq(knowledgeBaseCategories.id, knowledgeBaseArticles.categoryId),
        eq(knowledgeBaseArticles.isPublished, true)
      )
    )
    .where(eq(knowledgeBaseCategories.isActive, true))
    .groupBy(knowledgeBaseCategories.id)
    .orderBy(knowledgeBaseCategories.displayOrder);
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      article: knowledgeBaseArticles,
      category: knowledgeBaseCategories,
    })
    .from(knowledgeBaseArticles)
    .leftJoin(knowledgeBaseCategories, eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id))
    .where(
      and(
        eq(knowledgeBaseArticles.categoryId, categoryId),
        eq(knowledgeBaseArticles.isPublished, true)
      )
    )
    .orderBy(desc(knowledgeBaseArticles.views));
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      article: knowledgeBaseArticles,
      category: knowledgeBaseCategories,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(knowledgeBaseArticles)
    .leftJoin(knowledgeBaseCategories, eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id))
    .where(eq(knowledgeBaseArticles.slug, slug))
    .limit(1);

  return result[0] || null;
}

/**
 * Search knowledge base articles
 */
export async function searchKnowledgeBase(query: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      article: knowledgeBaseArticles,
      category: knowledgeBaseCategories,
    })
    .from(knowledgeBaseArticles)
    .leftJoin(knowledgeBaseCategories, eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id))
    .where(
      and(
        eq(knowledgeBaseArticles.isPublished, true),
        or(
          like(knowledgeBaseArticles.title, `%${query}%`),
          like(knowledgeBaseArticles.content, `%${query}%`),
          like(knowledgeBaseArticles.titleAr, `%${query}%`),
          like(knowledgeBaseArticles.contentAr, `%${query}%`)
        )
      )
    )
    .orderBy(desc(knowledgeBaseArticles.views))
    .limit(20);
}

/**
 * Increment article view count
 */
export async function incrementArticleViews(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(knowledgeBaseArticles)
    .set({
      views: sql`${knowledgeBaseArticles.views} + 1`,
    })
    .where(eq(knowledgeBaseArticles.id, articleId));
}

/**
 * Get popular articles (most viewed and most helpful)
 */
export async function getPopularArticles(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      article: knowledgeBaseArticles,
      category: {
        id: knowledgeBaseCategories.id,
        name: knowledgeBaseCategories.name,
        nameAr: knowledgeBaseCategories.nameAr,
      },
    })
    .from(knowledgeBaseArticles)
    .leftJoin(
      knowledgeBaseCategories,
      eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id)
    )
    .where(eq(knowledgeBaseArticles.isPublished, true))
    .orderBy(
      desc(knowledgeBaseArticles.views),
      desc(knowledgeBaseArticles.helpfulCount)
    )
    .limit(limit);
}

/**
 * Get related articles based on category and tags
 */
export async function getRelatedArticles(articleId: number, categoryId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      article: knowledgeBaseArticles,
      category: {
        id: knowledgeBaseCategories.id,
        name: knowledgeBaseCategories.name,
        nameAr: knowledgeBaseCategories.nameAr,
      },
    })
    .from(knowledgeBaseArticles)
    .leftJoin(
      knowledgeBaseCategories,
      eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id)
    )
    .where(
      and(
        eq(knowledgeBaseArticles.isPublished, true),
        eq(knowledgeBaseArticles.categoryId, categoryId),
        sql`${knowledgeBaseArticles.id} != ${articleId}`
      )
    )
    .orderBy(desc(knowledgeBaseArticles.views))
    .limit(limit);
}

/**
 * Vote on article helpfulness
 */
export async function voteArticleHelpful(articleId: number, isHelpful: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (isHelpful) {
    await db
      .update(knowledgeBaseArticles)
      .set({
        helpfulCount: sql`${knowledgeBaseArticles.helpfulCount} + 1`,
      })
      .where(eq(knowledgeBaseArticles.id, articleId));
  } else {
    await db
      .update(knowledgeBaseArticles)
      .set({
        notHelpfulCount: sql`${knowledgeBaseArticles.notHelpfulCount} + 1`,
      })
      .where(eq(knowledgeBaseArticles.id, articleId));
  }
}

// ============================================
// CANNED RESPONSES
// ============================================

/**
 * Get all canned responses
 */
export async function getCannedResponses(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(cannedResponses.isActive, true)];
  
  if (categoryId) {
    conditions.push(eq(cannedResponses.categoryId, categoryId));
  }

  return db
    .select()
    .from(cannedResponses)
    .where(and(...conditions))
    .orderBy(cannedResponses.usageCount);
}

/**
 * Get canned response by shortcut
 */
export async function getCannedResponseByShortcut(shortcut: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cannedResponses)
    .where(
      and(
        eq(cannedResponses.shortcut, shortcut),
        eq(cannedResponses.isActive, true)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Increment canned response usage count
 */
export async function incrementCannedResponseUsage(responseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(cannedResponses)
    .set({
      usageCount: sql`${cannedResponses.usageCount} + 1`,
    })
    .where(eq(cannedResponses.id, responseId));
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Get help desk statistics
 */
export async function getHelpDeskStats(departmentType?: string) {
  const db = await getDb();
  if (!db) return null;

  const conditions = departmentType ? [eq(supportTickets.departmentType, departmentType as any)] : [];
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const ticketQuery = db
    .select({
      totalTickets: count(),
      openTickets: count(sql`CASE WHEN ${supportTickets.status} = 'open' THEN 1 END`),
      inProgressTickets: count(sql`CASE WHEN ${supportTickets.status} = 'in_progress' THEN 1 END`),
      resolvedTickets: count(sql`CASE WHEN ${supportTickets.status} = 'resolved' THEN 1 END`),
      closedTickets: count(sql`CASE WHEN ${supportTickets.status} = 'closed' THEN 1 END`),
    })
    .from(supportTickets);
  
  const [ticketStats] = whereClause ? await ticketQuery.where(whereClause) : await ticketQuery;

  const [chatStats] = await db
    .select({
      totalConversations: count(),
      activeConversations: count(sql`CASE WHEN ${chatConversations.status} = 'active' THEN 1 END`),
      waitingConversations: count(sql`CASE WHEN ${chatConversations.status} = 'waiting' THEN 1 END`),
    })
    .from(chatConversations);

  return {
    tickets: ticketStats,
    chats: chatStats,
  };
}

/**
 * Get ticket categories
 */
export async function getTicketCategories(departmentType?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(ticketCategories.isActive, true)];
  
  if (departmentType) {
    conditions.push(eq(ticketCategories.departmentType, departmentType as any));
  }

  return db
    .select()
    .from(ticketCategories)
    .where(and(...conditions))
    .orderBy(ticketCategories.name);
}
