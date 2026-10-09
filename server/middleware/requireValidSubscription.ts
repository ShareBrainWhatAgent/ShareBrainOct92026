import { storage } from "../storage";
import type { RequestHandler } from "express";

export const requireValidSubscription: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Always fetch fresh user data from database - no caching
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has valid subscription status
    const hasValidSubscription = await validateSubscriptionStatus(user);
    
    if (!hasValidSubscription) {
      // Log subscription violation for audit trail
      console.log(`Subscription access denied for user ${user.id}: ${user.subscriptionStatus} - ${user.email}`);
      
      return res.status(403).json({ 
        message: "Valid subscription required", 
        needsSubscription: true,
        subscriptionStatus: user.subscriptionStatus,
        trialExpired: isTrialExpired(user)
      });
    }

    // Log successful subscription validation
    console.log(`Subscription validated for user ${user.id}: ${user.subscriptionStatus}`);
    next();
  } catch (error) {
    console.error("Error validating subscription:", error);
    return res.status(500).json({ message: "Subscription validation failed" });
  }
};

async function validateSubscriptionStatus(user: any): Promise<boolean> {
  // No subscription status = no access
  if (!user.subscriptionStatus || user.subscriptionStatus === "none") {
    return false;
  }

  // Active paid subscription = access granted
  if (user.subscriptionStatus === "active") {
    return true;
  }

  // Trial subscription = check if still valid
  if (user.subscriptionStatus === "trial") {
    // Must have Stripe customer ID and payment method
    if (!user.stripeCustomerId) {
      await storage.updateUserSubscriptionStatus(user.id, "expired");
      return false;
    }

    // Check trial expiration
    if (isTrialExpired(user)) {
      await storage.updateUserSubscriptionStatus(user.id, "expired");
      return false;
    }

    return true;
  }

  // Cancelled, expired, or any other status = no access
  if (user.subscriptionStatus === "cancelled" || user.subscriptionStatus === "expired") {
    return false;
  }

  // Unknown status = no access (fail secure)
  return false;
}

function isTrialExpired(user: any): boolean {
  if (!user.trialEndDate) {
    return true; // No trial end date = expired
  }

  const now = new Date();
  const trialEnd = new Date(user.trialEndDate);
  return now > trialEnd;
}

// Allow personal agents only - no subscription required
export const requireValidSubscriptionForCustomAgents: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if this is a personal agent creation
  const isPersonalAgent = req.body?.isPersonal === true;
  
  // Allow personal agents without subscription
  if (isPersonalAgent) {
    return next();
  }

  // For custom agents, require valid subscription
  return requireValidSubscription(req, res, next);
};