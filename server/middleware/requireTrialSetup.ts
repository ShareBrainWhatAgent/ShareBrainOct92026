import { storage } from "../storage";
import type { RequestHandler } from "express";

export const requireTrialSetup: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if user needs to complete trial signup
  const needsTrialSignup = !user.stripeCustomerId || (!user.subscriptionStatus || user.subscriptionStatus === "none");
  
  if (needsTrialSignup) {
    return res.status(403).json({ 
      message: "Trial setup required", 
      needsTrialSignup: true 
    });
  }

  next();
};