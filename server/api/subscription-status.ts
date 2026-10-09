import { storage } from "../storage";
import type { RequestHandler } from "express";

export const getSubscriptionStatus: RequestHandler = async (req: any, res) => {
  try {
    // Get user ID using same pattern as working endpoints
    const userId = req.user?.claims?.sub || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Always fetch fresh user data from database
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check subscription validity
    const subscriptionStatus = await getDetailedSubscriptionStatus(user);
    
    res.json(subscriptionStatus);
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
};

async function getDetailedSubscriptionStatus(user: any) {
  const now = new Date();
  const trialEndDate = user.trialEndDate ? new Date(user.trialEndDate) : null;
  const isTrialExpired = trialEndDate ? now > trialEndDate : true;

  // Determine if user needs subscription
  let needsSubscription = false;
  
  if (!user.subscriptionStatus || user.subscriptionStatus === "none") {
    needsSubscription = true;
  } else if (user.subscriptionStatus === "trial" && (!user.stripeCustomerId || isTrialExpired)) {
    needsSubscription = true;
    // Update expired trial status
    await storage.updateUserSubscriptionStatus(user.id, "expired");
  } else if (user.subscriptionStatus === "expired" || user.subscriptionStatus === "cancelled") {
    needsSubscription = true;
  }

  return {
    needsSubscription,
    subscriptionStatus: user.subscriptionStatus || "none",
    isTrialActive: user.subscriptionStatus === "trial" && !isTrialExpired,
    trialExpired: isTrialExpired && user.subscriptionStatus === "trial",
    hasPaymentMethod: !!user.stripeCustomerId,
    trialStartDate: user.trialStartDate,
    trialEndDate: user.trialEndDate,
    userId: user.id
  };
}