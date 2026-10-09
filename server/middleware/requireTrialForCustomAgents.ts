import { storage } from "../storage";
import type { RequestHandler } from "express";

// This middleware only blocks custom agent creation, not personal agents
export const requireTrialForCustomAgents: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if this is a personal agent creation
  const isPersonalAgent = req.body?.isPersonal === true;
  
  // Allow personal agents without trial setup
  if (isPersonalAgent) {
    return next();
  }

  // For custom agents, require trial setup
  const user = await storage.getUser(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if user needs to complete trial signup for custom agents
  const needsTrialSignup = !user.stripeCustomerId || (!user.subscriptionStatus || user.subscriptionStatus === "none");
  
  if (needsTrialSignup) {
    return res.status(403).json({ 
      message: "Trial setup required for custom agents", 
      needsTrialSignup: true 
    });
  }

  next();
};