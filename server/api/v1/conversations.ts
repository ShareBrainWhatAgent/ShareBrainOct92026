import { Request, Response } from "express";
import { db } from "../../db";
import { conversationParticipants, unifiedMessages } from "@shared/schema";
import { and, eq } from "drizzle-orm";

// GET /v1/conversations/:conversationId/messages - Fetch conversation history
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({
        error: {
          message: "Invalid conversation ID",
          type: "validation_error",
          param: "conversationId",
          code: "invalid_parameter",
        },
      });
    }

    const userId = req.apiKeyData?.user_id;
    if (!userId) {
      return res.status(401).json({
        error: {
          message: "Unauthorized",
          type: "authentication_error",
          param: null,
          code: "unauthorized",
        },
      });
    }

    // Verify user is a participant in the conversation
    const participant = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
      .limit(1);

    if (!participant[0]) {
      return res.status(403).json({
        error: {
          message: "Access denied",
          type: "permission_error",
          param: null,
          code: "not_participant",
        },
      });
    }

    const messages = await db
      .select()
      .from(unifiedMessages)
      .where(eq(unifiedMessages.conversationId, conversationId))
      .orderBy(unifiedMessages.createdAt);

    const formatted = messages.map((m) => ({
      id: m.id.toString(),
      role: m.senderType === "agent" ? "assistant" : "user",
      content: m.content,
      created_at: Math.floor(new Date(m.createdAt).getTime() / 1000),
    }));

    return res.json({ object: "list", data: formatted });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return res.status(500).json({
      error: {
        message: "Failed to fetch messages",
        type: "server_error",
        param: null,
        code: "internal_error",
      },
    });
  }
};
