import { db } from "./db";
import { 
  communityMessages, 
  communitySummaries, 
  agents,
  type CommunityMessage,
  type CommunitySummary,
  type InsertCommunityMessage,
  type InsertCommunitySummary 
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte, count } from "drizzle-orm";
import { generateAgentResponse } from "./openai";

/**
 * Community Agent Service
 * 
 * Manages Community Agents where all user messages are publicly visible
 * with AI-powered summarization capabilities for daily, weekly, and topic-based insights.
 * 
 * Always consult COMMUNITY_AGENT_MANUAL.md before making changes to this service.
 */
export class CommunityAgentService {
  
  /**
   * Store a community message in the public feed
   */
  async storeMessage(data: InsertCommunityMessage): Promise<CommunityMessage> {
    const [message] = await db
      .insert(communityMessages)
      .values(data)
      .returning();
    return message;
  }

  /**
   * Get public message feed for a community agent
   */
  async getMessages(
    agentId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<CommunityMessage[]> {
    return await db
      .select()
      .from(communityMessages)
      .where(and(
        eq(communityMessages.agentId, agentId),
        eq(communityMessages.isVisible, true)
      ))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get recent messages for live updates
   */
  async getRecentMessages(
    agentId: number, 
    sinceTimestamp: Date
  ): Promise<CommunityMessage[]> {
    return await db
      .select()
      .from(communityMessages)
      .where(and(
        eq(communityMessages.agentId, agentId),
        eq(communityMessages.isVisible, true),
        gte(communityMessages.createdAt, sinceTimestamp)
      ))
      .orderBy(desc(communityMessages.createdAt));
  }

  /**
   * Generate AI summary for a specific time period
   */
  async generateSummary(
    agentId: number,
    summaryType: 'daily' | 'weekly' | 'topic' | 'monthly',
    period: string,
    topicKeyword?: string
  ): Promise<CommunitySummary> {
    // Get messages for the period
    const messages = await this.getMessagesForPeriod(agentId, summaryType, period, topicKeyword);
    
    if (messages.length === 0) {
      throw new Error(`No messages found for ${summaryType} summary: ${period}`);
    }

    // Prepare messages for AI analysis
    const messageText = messages.map(m => 
      `[${m.role}] ${m.userHandle || m.agentName}: ${m.content}`
    ).join('\n');

    // Generate AI summary using Llama 3.1 70B
    const summaryPrompt = this.buildSummaryPrompt(summaryType, period, messageText, messages.length);
    
    const completion = await openai.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert community analyst. Create insightful, engaging summaries of community discussions. Focus on key themes, interesting insights, and community dynamics. Always maintain a positive, constructive tone."
        },
        {
          role: "user", 
          content: summaryPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summaryContent = completion.choices[0]?.message?.content || "Summary generation failed";
    
    // Extract key topics from the summary
    const topicsPrompt = `Extract 3-5 key topics from this community summary. Return only a JSON array of topic strings, no other text:\n\n${summaryContent}`;
    
    const topicsCompletion = await openai.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [{ role: "user", content: topicsPrompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    let keyTopics: string[] = [];
    try {
      const topicsText = topicsCompletion.choices[0]?.message?.content || "[]";
      keyTopics = JSON.parse(topicsText);
    } catch (error) {
      console.error("Failed to parse topics:", error);
      keyTopics = ["Community Discussion", "AI Interaction"];
    }

    // Get unique user count
    const uniqueUsers = new Set(messages.filter(m => m.userId).map(m => m.userId)).size;

    // Store the summary
    const summaryData: InsertCommunitySummary = {
      agentId,
      summaryType,
      summaryPeriod: period,
      title: this.generateSummaryTitle(summaryType, period),
      content: summaryContent,
      messageCount: messages.length,
      userCount: uniqueUsers,
      keyTopics,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        topicKeyword: topicKeyword || null
      }
    };

    const [summary] = await db
      .insert(communitySummaries)
      .values(summaryData)
      .returning();

    return summary;
  }

  /**
   * Get all summaries for an agent
   */
  async getSummaries(
    agentId: number,
    summaryType?: string,
    limit: number = 20
  ): Promise<CommunitySummary[]> {
    const conditions = [eq(communitySummaries.agentId, agentId)];
    
    if (summaryType) {
      conditions.push(eq(communitySummaries.summaryType, summaryType));
    }

    return await db
      .select()
      .from(communitySummaries)
      .where(and(...conditions))
      .orderBy(desc(communitySummaries.createdAt))
      .limit(limit);
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(agentId: number): Promise<{
    totalMessages: number;
    totalUsers: number;
    dailyMessages: number;
    weeklyMessages: number;
    topTopics: string[];
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total message count
    const [totalResult] = await db
      .select({ count: count() })
      .from(communityMessages)
      .where(and(
        eq(communityMessages.agentId, agentId),
        eq(communityMessages.isVisible, true)
      ));

    // Get daily message count
    const [dailyResult] = await db
      .select({ count: count() })
      .from(communityMessages)
      .where(and(
        eq(communityMessages.agentId, agentId),
        eq(communityMessages.isVisible, true),
        gte(communityMessages.createdAt, oneDayAgo)
      ));

    // Get weekly message count
    const [weeklyResult] = await db
      .select({ count: count() })
      .from(communityMessages)
      .where(and(
        eq(communityMessages.agentId, agentId),
        eq(communityMessages.isVisible, true),
        gte(communityMessages.createdAt, oneWeekAgo)
      ));

    // Get unique users count
    const users = await db
      .selectDistinct({ userId: communityMessages.userId })
      .from(communityMessages)
      .where(and(
        eq(communityMessages.agentId, agentId),
        eq(communityMessages.isVisible, true)
      ));

    // Get top topics from recent summaries
    const recentSummaries = await db
      .select({ keyTopics: communitySummaries.keyTopics })
      .from(communitySummaries)
      .where(eq(communitySummaries.agentId, agentId))
      .orderBy(desc(communitySummaries.createdAt))
      .limit(5);

    const allTopics = recentSummaries
      .flatMap(s => s.keyTopics as string[] || [])
      .slice(0, 10);

    return {
      totalMessages: totalResult.count,
      totalUsers: users.filter(u => u.userId).length,
      dailyMessages: dailyResult.count,
      weeklyMessages: weeklyResult.count,
      topTopics: allTopics
    };
  }

  /**
   * Check if agent is a community agent
   */
  async isCommunityAgent(agentId: number): Promise<boolean> {
    const [agent] = await db
      .select({ isCommunityAgent: agents.isCommunityAgent })
      .from(agents)
      .where(eq(agents.id, agentId));
    
    return agent?.isCommunityAgent || false;
  }

  // Private helper methods

  private async getMessagesForPeriod(
    agentId: number,
    summaryType: string,
    period: string,
    topicKeyword?: string
  ): Promise<CommunityMessage[]> {
    let startDate: Date;
    let endDate: Date;

    if (summaryType === 'daily') {
      startDate = new Date(period);
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (summaryType === 'weekly') {
      const year = parseInt(period.split('-W')[0]);
      const week = parseInt(period.split('-W')[1]);
      startDate = this.getDateFromWeek(year, week);
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (summaryType === 'topic') {
      // For topic summaries, get last 7 days
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // Monthly
      const [year, month] = period.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    }

    const conditions = [
      eq(communityMessages.agentId, agentId),
      eq(communityMessages.isVisible, true),
      gte(communityMessages.createdAt, startDate),
      lte(communityMessages.createdAt, endDate)
    ];

    // If topic keyword provided, filter by content
    if (topicKeyword) {
      conditions.push(
        sql`${communityMessages.content} ILIKE ${`%${topicKeyword}%`}`
      );
    }

    return await db
      .select()
      .from(communityMessages)
      .where(and(...conditions))
      .orderBy(communityMessages.createdAt);
  }

  private getDateFromWeek(year: number, week: number): Date {
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7 - jan1.getDay() + 1;
    return new Date(year, 0, 1 + days);
  }

  private buildSummaryPrompt(
    summaryType: string,
    period: string,
    messageText: string,
    messageCount: number
  ): string {
    const base = `Analyze these ${messageCount} community messages and create an engaging ${summaryType} summary for period ${period}:\n\n${messageText}\n\n`;
    
    if (summaryType === 'daily') {
      return base + "Focus on: key discussions, user engagement patterns, interesting insights shared today, and emerging topics. Keep it concise but insightful.";
    } else if (summaryType === 'weekly') {
      return base + "Focus on: major trends, recurring themes, community growth, notable conversations, and how discussions evolved throughout the week.";
    } else if (summaryType === 'topic') {
      return base + "Focus on: deep analysis of this specific topic, different perspectives shared, key insights, and how the community collectively explored this subject.";
    } else {
      return base + "Focus on: monthly trends, community evolution, major discussions, user behavior patterns, and significant insights that emerged.";
    }
  }

  private generateSummaryTitle(summaryType: string, period: string): string {
    if (summaryType === 'daily') {
      return `Daily Community Insights - ${period}`;
    } else if (summaryType === 'weekly') {
      return `Weekly Community Trends - ${period}`;
    } else if (summaryType === 'topic') {
      const topic = period.replace('topic-', '').replace(/-/g, ' ');
      return `${topic.charAt(0).toUpperCase() + topic.slice(1)} Discussion Summary`;
    } else {
      return `Monthly Community Review - ${period}`;
    }
  }
}

export const communityAgentService = new CommunityAgentService();