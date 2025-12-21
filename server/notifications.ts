import { getDb } from "./db";
import { notifications } from "../drizzle/schema";

/**
 * Notification helper functions for creating system notifications
 * These are called from various parts of the application to notify users
 */

export async function createNotification(params: {
  userId: number;
  type: "system" | "kyc" | "investment" | "distribution" | "property";
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notifications] Database not available");
    return null;
  }

  try {
    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl || null,
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("[Notifications] Failed to create notification:", error);
    return null;
  }
}

// KYC-specific notification helpers

export async function notifyKYCDocumentApproved(userId: number, documentType: string) {
  return createNotification({
    userId,
    type: "kyc",
    title: "Document Approved ✓",
    message: `Your ${documentType.replace(/_/g, " ")} has been approved. You're one step closer to investing!`,
    actionUrl: "/profile?tab=verification",
  });
}

export async function notifyKYCDocumentRejected(userId: number, documentType: string, reason?: string) {
  return createNotification({
    userId,
    type: "kyc",
    title: "Document Requires Attention",
    message: `Your ${documentType.replace(/_/g, " ")} was rejected. ${reason || "Please upload a clearer document."}`,
    actionUrl: "/profile?tab=verification",
  });
}

export async function notifyKYCDocumentPending(userId: number, documentType: string) {
  return createNotification({
    userId,
    type: "kyc",
    title: "Document Under Review",
    message: `Your ${documentType.replace(/_/g, " ")} is being reviewed. We'll notify you once it's processed.`,
    actionUrl: "/profile?tab=verification",
  });
}

export async function notifyKYCVerificationLevelChanged(
  userId: number,
  newLevel: "level_0" | "level_1" | "level_2",
  canInvest: boolean
) {
  const levelNames = {
    level_0: "Unverified",
    level_1: "Basic Verification",
    level_2: "Full Verification",
  };

  const messages = {
    level_0: "Your verification level has been updated. Complete your profile to start investing.",
    level_1: "Congratulations! You've achieved basic verification. Complete full verification to unlock all features.",
    level_2: "🎉 Congratulations! You're fully verified and can now invest in all properties!",
  };

  return createNotification({
    userId,
    type: "kyc",
    title: `Verification Level: ${levelNames[newLevel]}`,
    message: messages[newLevel],
    actionUrl: canInvest ? "/properties" : "/profile?tab=verification",
  });
}

export async function notifyKYCQuestionnaireSubmitted(userId: number) {
  return createNotification({
    userId,
    type: "kyc",
    title: "Questionnaire Submitted",
    message: "Thank you for completing the investment questionnaire. We're reviewing your responses.",
    actionUrl: "/profile?tab=verification",
  });
}

export async function notifyKYCQuestionnaireApproved(userId: number) {
  return createNotification({
    userId,
    type: "kyc",
    title: "Questionnaire Approved ✓",
    message: "Your investment questionnaire has been approved. You're ready to start investing!",
    actionUrl: "/properties",
  });
}

export async function notifyKYCQuestionnaireRejected(userId: number) {
  return createNotification({
    userId,
    type: "kyc",
    title: "Questionnaire Requires Revision",
    message: "Your investment questionnaire needs additional information. Please review and resubmit.",
    actionUrl: "/profile?tab=verification",
  });
}

export async function notifyKYCFullyVerified(userId: number) {
  return createNotification({
    userId,
    type: "kyc",
    title: "🎉 Account Fully Verified!",
    message: "Congratulations! Your account is fully verified. You can now invest in all available properties.",
    actionUrl: "/properties",
  });
}

// Investment-related notifications

export async function notifyInvestmentCreated(userId: number, propertyName: string, amount: number) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount / 100);

  return createNotification({
    userId,
    type: "investment",
    title: "Investment Created",
    message: `Your investment of ${formattedAmount} in ${propertyName} is pending payment confirmation.`,
    actionUrl: "/portfolio",
  });
}

export async function notifyInvestmentConfirmed(userId: number, propertyName: string, amount: number) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount / 100);

  return createNotification({
    userId,
    type: "investment",
    title: "Investment Confirmed ✓",
    message: `Your investment of ${formattedAmount} in ${propertyName} has been confirmed. Welcome to property ownership!`,
    actionUrl: "/portfolio",
  });
}

export async function notifyIncomeDistribution(userId: number, amount: number, propertyName: string) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100);

  return createNotification({
    userId,
    type: "distribution",
    title: "Income Received 💰",
    message: `You've received ${formattedAmount} from your investment in ${propertyName}.`,
    actionUrl: "/portfolio?tab=income",
  });
}

export async function notifyPropertyFunded(userId: number, propertyName: string) {
  return createNotification({
    userId,
    type: "property",
    title: "Property Fully Funded",
    message: `${propertyName} has reached its funding goal. Your investment is now active!`,
    actionUrl: "/portfolio",
  });
}

export async function notifyPropertyUpdate(userId: number, propertyName: string, updateMessage: string) {
  return createNotification({
    userId,
    type: "property",
    title: `Update: ${propertyName}`,
    message: updateMessage,
    actionUrl: "/portfolio",
  });
}

// System notifications

export async function notifyWelcome(userId: number) {
  return createNotification({
    userId,
    type: "system",
    title: "Welcome to Emtelaak! 🏠",
    message: "Start your real estate investment journey by completing your KYC verification.",
    actionUrl: "/profile?tab=verification",
  });
}

export async function notifySystemMaintenance(userId: number, message: string) {
  return createNotification({
    userId,
    type: "system",
    title: "System Maintenance",
    message,
  });
}
