import { RequestHandler } from "express";

// Admin middleware to check if user is tom@colorfulranch.com
export const requireAdmin: RequestHandler = (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userEmail = req.user?.email;
  if (userEmail !== "tom@colorfulranch.com") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};