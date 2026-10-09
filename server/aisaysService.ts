import { db } from "./db";
import { aiSaysResponses, aiSaysInteractions, type AiSaysResponse, type AiSaysInteraction } from "@shared/schema";
import { generateAgentResponse } from "./openai";
import { eq } from "drizzle-orm";

/**
 * Create a new AI-generated response and store it in the database.
 */
export async function createAiSaysResponse(query: string, aiProvider = "GPT-4o"): Promise<AiSaysResponse> {
  const aiResult = await generateAgentResponse(
    "You are AIsays, a helpful assistant providing concise answers.",
    query,
    [],
    aiProvider
  );

  try {
    const inserted = await db
      .insert(aiSaysResponses)
      .values({
        query,
        aiAnswer: aiResult.content,
        aiProvider,
        confidenceScore: 1,
        status: "pending",
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error("Failed to store AiSays response:", error);
    // Fallback response when database isn't available
    return {
      id: -1,
      query,
      aiAnswer: aiResult.content,
      aiProvider,
      confidenceScore: 1,
      status: "pending",
      createdAt: new Date(),
    } as AiSaysResponse;
  }
}

/**
 * Record an interaction (agree/flag) for a given response.
 */
export async function addAiSaysInteraction(
  responseId: number,
  interactionType: "agree" | "flag" | "edit",
  userId?: string,
  reasoning?: string
): Promise<AiSaysInteraction> {
  const inserted = await db
    .insert(aiSaysInteractions)
    .values({ responseId, interactionType, userId, reasoning })
    .returning();
  return inserted[0];
}

/**
 * Retrieve a stored response by ID.
 */
export async function getAiSaysResponse(id: number): Promise<AiSaysResponse | undefined> {
  const result = await db.select().from(aiSaysResponses).where(eq(aiSaysResponses.id, id));
  return result[0];
}
