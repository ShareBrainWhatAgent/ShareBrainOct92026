import { db } from "./db";
import { personalMemories, agents, users, friendRequests } from "@shared/schema";
import { eq, and, or, ilike, inArray } from "drizzle-orm";

export interface FriendMemory {
  friendHandle: string;
  friendName: string;
  memory: string;
  relevanceScore: number;
}

export class SocialMemoryService {
  /**
   * Query friends' personal assistant memories for relevant information
   */
  async queryFriendsMemories(userId: string, query: string): Promise<FriendMemory[]> {
    try {
      // Get all accepted friends
      const friendships = await db
        .select({
          friendId: friendRequests.senderId,
          friendIdReceiver: friendRequests.receiverId
        })
        .from(friendRequests)
        .where(
          and(
            eq(friendRequests.status, "accepted"),
            or(
              eq(friendRequests.senderId, userId),
              eq(friendRequests.receiverId, userId)
            )
          )
        );

      // Extract friend IDs (exclude current user)
      const friendIds = friendships.map(f => 
        f.friendId === userId ? f.friendIdReceiver : f.friendId
      ).filter(id => id !== userId);

      if (friendIds.length === 0) {
        return [];
      }

      // Get friends' personal assistants
      const friendsPersonalAgents = await db
        .select({
          agentId: agents.id,
          userId: agents.userId,
          handle: users.handle,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(agents)
        .innerJoin(users, eq(agents.userId, users.id))
        .where(
          and(
            inArray(agents.userId, friendIds),
            eq(agents.isPersonal, true)
          )
        );

      if (friendsPersonalAgents.length === 0) {
        return [];
      }

      // Get agent IDs for memory search
      const agentIds = friendsPersonalAgents.map(a => a.agentId);

      // Search for relevant memories using simple keyword matching
      const keywords = this.extractKeywords(query);
      const memories = await this.searchMemoriesByKeywords(agentIds, keywords);

      // Combine memories with friend information
      const friendMemories: FriendMemory[] = memories.map(memory => {
        const friendInfo = friendsPersonalAgents.find(f => f.agentId === memory.agentId);
        return {
          friendHandle: friendInfo?.handle || `@${friendInfo?.firstName}`,
          friendName: friendInfo?.firstName || 'Unknown',
          memory: memory.memoryValue,
          relevanceScore: this.calculateRelevanceScore(memory.memoryValue, query)
        };
      });

      // Sort by relevance score (highest first)
      return friendMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);

    } catch (error) {
      console.error('Error querying friends memories:', error);
      return [];
    }
  }

  /**
   * Extract keywords from user query for memory search
   */
  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - remove common words and split
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'any', 'anyone', 'know', 'knows', 'good', 'best', 'great'];
    
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }

  /**
   * Search memories using keyword matching
   */
  private async searchMemoriesByKeywords(agentIds: number[], keywords: string[]): Promise<any[]> {
    if (keywords.length === 0) return [];

    // Create OR conditions for each keyword
    const conditions = keywords.map(keyword => 
      ilike(personalMemories.memoryValue, `%${keyword}%`)
    );

    return await db
      .select({
        agentId: personalMemories.agentId,
        memoryKey: personalMemories.memoryKey,
        memoryValue: personalMemories.memoryValue,
        createdAt: personalMemories.createdAt
      })
      .from(personalMemories)
      .where(
        and(
          inArray(personalMemories.agentId, agentIds),
          or(...conditions)
        )
      )
      .limit(50); // Limit results to prevent overwhelming responses
  }

  /**
   * Calculate relevance score for a memory based on keyword matches
   */
  private calculateRelevanceScore(memoryValue: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const memoryWords = memoryValue.toLowerCase().split(/\s+/);
    
    let score = 0;
    let exactMatches = 0;
    
    for (const qword of queryWords) {
      if (qword.length > 2) {
        // Exact word match
        if (memoryWords.includes(qword)) {
          score += 2;
          exactMatches++;
        }
        // Partial match
        else if (memoryWords.some(mword => mword.includes(qword) || qword.includes(mword))) {
          score += 1;
        }
      }
    }
    
    // Bonus for multiple matches
    if (exactMatches > 1) {
      score += exactMatches * 0.5;
    }
    
    return score;
  }

  /**
   * Format friend memories into a strict database-only response
   */
  formatFriendMemoriesResponse(memories: FriendMemory[], query: string): string {
    if (memories.length === 0) {
      return "🔍 **Database Search Results**\n\nNo information found in your friends' personal assistant memories about this topic.\n\n**What this means:**\n- Your friends haven't shared any memories about this topic with their personal assistants\n- They may not have this information stored yet\n- You can ask your friends directly to add this information to their personal assistants\n\n**Note:** This search only returns exact information from your friends' stored memories - no additional information is generated.";
    }

    let response = "🔍 **Database Search Results**\n\n";
    response += `Found ${memories.length} relevant ${memories.length === 1 ? 'memory' : 'memories'} from your friends:\n\n`;
    
    // Group memories by friend to avoid repetition
    const memoriesByFriend = memories.reduce((acc, memory) => {
      if (!acc[memory.friendHandle]) {
        acc[memory.friendHandle] = [];
      }
      acc[memory.friendHandle].push(memory);
      return acc;
    }, {} as Record<string, FriendMemory[]>);

    // Format response with friend attribution - show all relevant memories
    for (const [friendHandle, friendMemories] of Object.entries(memoriesByFriend)) {
      response += `**${friendHandle}** (${friendMemories.length} ${friendMemories.length === 1 ? 'memory' : 'memories'}):\n`;
      
      // Show up to 3 most relevant memories per friend
      friendMemories.slice(0, 3).forEach((memory, index) => {
        response += `${index + 1}. ${memory.memory}\n`;
      });
      
      if (friendMemories.length > 3) {
        response += `... and ${friendMemories.length - 3} more memories\n`;
      }
      response += '\n';
    }

    response += "**Important:** This information comes directly from your friends' stored memories - no additional content has been generated. If you need more information, ask your friends to share more details with their personal assistants.";

    return response;
  }

  /**
   * Enhanced search method with strict database-only validation
   */
  async queryFriendsMemoriesStrict(userId: string, query: string): Promise<{
    memories: FriendMemory[];
    searchMetadata: {
      totalFriends: number;
      searchedAgents: number;
      keywordsUsed: string[];
      queryLength: number;
      isValidQuery: boolean;
    };
  }> {
    const searchMetadata = {
      totalFriends: 0,
      searchedAgents: 0,
      keywordsUsed: [],
      queryLength: query.length,
      isValidQuery: query.trim().length > 0
    };

    if (!searchMetadata.isValidQuery) {
      return { memories: [], searchMetadata };
    }

    // Get friends and their personal assistants
    const friendships = await db
      .select({
        friendId: friendRequests.senderId,
        friendIdReceiver: friendRequests.receiverId
      })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.status, "accepted"),
          or(
            eq(friendRequests.senderId, userId),
            eq(friendRequests.receiverId, userId)
          )
        )
      );

    const friendIds = friendships.map(f => 
      f.friendId === userId ? f.friendIdReceiver : f.friendId
    ).filter(id => id !== userId);

    searchMetadata.totalFriends = friendIds.length;

    if (friendIds.length === 0) {
      return { memories: [], searchMetadata };
    }

    const friendsPersonalAgents = await db
      .select({
        agentId: agents.id,
        userId: agents.userId,
        handle: users.handle,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(agents)
      .innerJoin(users, eq(agents.userId, users.id))
      .where(
        and(
          inArray(agents.userId, friendIds),
          eq(agents.isPersonal, true)
        )
      );

    searchMetadata.searchedAgents = friendsPersonalAgents.length;

    if (friendsPersonalAgents.length === 0) {
      return { memories: [], searchMetadata };
    }

    const keywords = this.extractKeywords(query);
    searchMetadata.keywordsUsed = keywords;

    const agentIds = friendsPersonalAgents.map(a => a.agentId);
    const memories = await this.searchMemoriesByKeywords(agentIds, keywords);

    const friendMemories: FriendMemory[] = memories.map(memory => {
      const friendInfo = friendsPersonalAgents.find(f => f.agentId === memory.agentId);
      return {
        friendHandle: friendInfo?.handle || `@${friendInfo?.firstName}`,
        friendName: friendInfo?.firstName || 'Unknown',
        memory: memory.memoryValue,
        relevanceScore: this.calculateRelevanceScore(memory.memoryValue, query)
      };
    });

    return { 
      memories: friendMemories.sort((a, b) => b.relevanceScore - a.relevanceScore),
      searchMetadata 
    };
  }

  /**
   * Format strict database response with search metadata
   */
  formatStrictDatabaseResponse(memories: FriendMemory[], searchMetadata: any, query: string): string {
    const header = "🔍 **STRICT DATABASE SEARCH**\n\n";
    const metadata = `**Query:** "${query}"\n**Friends:** ${searchMetadata.totalFriends} | **Agents searched:** ${searchMetadata.searchedAgents} | **Keywords:** ${searchMetadata.keywordsUsed.join(', ')}\n\n`;
    
    if (memories.length === 0) {
      return header + metadata + 
        "**RESULT:** No matching memories found\n\n" +
        "**This means:**\n" +
        "• None of your friends have stored information about this topic\n" +
        "• The keywords didn't match any existing memories\n" +
        "• Your friends may need to add more details to their personal assistants\n\n" +
        "**NOTE:** This search only returns exact stored information - no content is generated.";
    }

    let response = header + metadata + `**RESULT:** Found ${memories.length} matching memories\n\n`;
    
    const memoriesByFriend = memories.reduce((acc, memory) => {
      if (!acc[memory.friendHandle]) {
        acc[memory.friendHandle] = [];
      }
      acc[memory.friendHandle].push(memory);
      return acc;
    }, {} as Record<string, FriendMemory[]>);

    for (const [friendHandle, friendMemories] of Object.entries(memoriesByFriend)) {
      response += `**${friendHandle}** (${friendMemories.length} memories):\n`;
      
      friendMemories.slice(0, 3).forEach((memory, index) => {
        response += `${index + 1}. "${memory.memory}" (relevance: ${memory.relevanceScore.toFixed(1)})\n`;
      });
      
      if (friendMemories.length > 3) {
        response += `... and ${friendMemories.length - 3} more memories\n`;
      }
      response += '\n';
    }

    response += "**NOTE:** All information above is retrieved directly from stored memories - no additional content generated.";
    return response;
  }
}

export const socialMemoryService = new SocialMemoryService();