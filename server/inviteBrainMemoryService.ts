import { storage } from "./storage";
import { InviteBrainMemory, InsertInviteBrainMemory, BrainMembership } from "@shared/schema";
import { intelligentMemoryService, MemoryCategory } from "./intelligentMemoryService";

/**
 * Invite Brain Memory Service
 * 
 * Extends the existing intelligent memory system specifically for Invite Brain System.
 * Provides isolated memory storage and retrieval with role-based access control.
 * 
 * Key Features:
 * - Complete memory isolation per invite brain
 * - Role-based memory contribution (creators, contributors, viewers)
 * - AI-powered memory classification using existing system
 * - Context injection for invite brain conversations
 * - Zero memory leakage between different brain systems
 * 
 * CRITICAL: This service maintains absolute isolation from:
 * - Personal memories (personalMemories table)
 * - Friends memories (friendsMemories table) 
 * - Global Brain memories (sharedMemories table)
 */

export interface InviteBrainMemoryContext {
  brainId: number;
  userId: string;
  userRole: 'creator' | 'contributor' | 'viewer';
  brainName: string;
  memberCount: number;
}

export class InviteBrainMemoryService {
  
  /**
   * Analyze and store memory for an invite brain using AI classification
   * Uses the existing intelligentMemoryService for consistent memory detection
   */
  async analyzeAndStoreMemory(
    context: InviteBrainMemoryContext,
    messageContent: string,
    originalStatement: string
  ): Promise<InviteBrainMemory | null> {
    try {
      // Only creators and contributors can add memories
      if (context.userRole === 'viewer') {
        console.log(`[InviteBrainMemory] User ${context.userId} is viewer - cannot contribute memories`);
        return null;
      }

      // Use existing AI memory analysis system
      const memoryAnalysis = await intelligentMemoryService.analyzeMessageForMemories(messageContent);
      
      if (!memoryAnalysis || !memoryAnalysis.containsMemory) {
        return null;
      }

      // Store each detected memory in the invite brain memory system
      for (const memory of memoryAnalysis.memories) {
        const existingMemory = await storage.findInviteBrainMemoryByKey(
          context.brainId, 
          memory.key
        );

        if (existingMemory) {
          // Update existing memory
          await storage.updateInviteBrainMemory(
            existingMemory.id,
            memory.value,
            originalStatement
          );
          console.log(`[InviteBrainMemory] Updated memory for brain ${context.brainId}: ${memory.key}`);
        } else {
          // Create new memory
          const newMemoryData: InsertInviteBrainMemory = {
            brainId: context.brainId,
            contributorId: context.userId,
            memoryKey: memory.key,
            memoryValue: memory.value,
            originalStatement,
            memoryCategory: memory.category as MemoryCategory,
            contributorRole: context.userRole,
          };

          const createdMemory = await storage.createInviteBrainMemory(newMemoryData);
          console.log(`[InviteBrainMemory] Created new memory for brain ${context.brainId}: ${memory.key}`);
          return createdMemory;
        }
      }

      return null;
    } catch (error) {
      console.error('[InviteBrainMemory] Error analyzing and storing memory:', error);
      return null;
    }
  }

  /**
   * Get formatted memory context for AI responses
   * Provides invite brain-specific memories with contributor attribution
   */
  async getMemoryContext(brainId: number): Promise<string> {
    try {
      const memories = await storage.getInviteBrainMemories(brainId);
      
      if (memories.length === 0) {
        return "No previous memories stored for this invite brain.";
      }

      // Group memories by category for better organization
      const categorizedMemories: { [key: string]: InviteBrainMemory[] } = {};
      
      for (const memory of memories) {
        const category = memory.memoryCategory || 'general';
        if (!categorizedMemories[category]) {
          categorizedMemories[category] = [];
        }
        categorizedMemories[category].push(memory);
      }

      // Format memories with contributor information
      let context = "\n=== INVITE BRAIN MEMORIES ===\n";
      
      for (const [category, categoryMemories] of Object.entries(categorizedMemories)) {
        context += `\n${category.toUpperCase()}:\n`;
        
        for (const memory of categoryMemories.slice(0, 10)) { // Limit to 10 per category
          const upvoteInfo = memory.upvotes > 0 ? ` (${memory.upvotes} upvotes)` : '';
          context += `- ${memory.memoryKey}: ${memory.memoryValue}${upvoteInfo}\n`;
        }
      }

      context += "\n=== END INVITE BRAIN MEMORIES ===\n";
      return context;
    } catch (error) {
      console.error('[InviteBrainMemory] Error getting memory context:', error);
      return "Error retrieving invite brain memories.";
    }
  }

  /**
   * Get user's role in an invite brain
   * Used for permission checks and memory attribution
   */
  async getUserRole(brainId: number, userId: string): Promise<'creator' | 'contributor' | 'viewer' | null> {
    try {
      const membership = await storage.getBrainMembership(brainId, userId);
      return membership?.role as ('creator' | 'contributor' | 'viewer') || null;
    } catch (error) {
      console.error('[InviteBrainMemory] Error getting user role:', error);
      return null;
    }
  }

  /**
   * Check if user has access to an invite brain
   * Validates membership and role permissions
   */
  async validateAccess(brainId: number, userId: string): Promise<{
    hasAccess: boolean;
    role: 'creator' | 'contributor' | 'viewer' | null;
    membership: BrainMembership | null;
  }> {
    try {
      const membership = await storage.getBrainMembership(brainId, userId);
      
      if (!membership || membership.status !== 'active') {
        return {
          hasAccess: false,
          role: null,
          membership: null
        };
      }

      return {
        hasAccess: true,
        role: membership.role as ('creator' | 'contributor' | 'viewer'),
        membership
      };
    } catch (error) {
      console.error('[InviteBrainMemory] Error validating access:', error);
      return {
        hasAccess: false,
        role: null,
        membership: null
      };
    }
  }

  /**
   * Get invite brain statistics for dashboard/analytics
   */
  async getInviteBrainStats(brainId: number): Promise<{
    totalMemories: number;
    memoriesByCategory: { [key: string]: number };
    topContributors: { userId: string; role: string; memoryCount: number }[];
    recentActivity: InviteBrainMemory[];
  }> {
    try {
      const memories = await storage.getInviteBrainMemories(brainId);
      
      // Calculate statistics
      const memoriesByCategory: { [key: string]: number } = {};
      const contributorStats: { [key: string]: { role: string; count: number } } = {};
      
      for (const memory of memories) {
        // Category stats
        const category = memory.memoryCategory || 'general';
        memoriesByCategory[category] = (memoriesByCategory[category] || 0) + 1;
        
        // Contributor stats
        if (!contributorStats[memory.contributorId]) {
          contributorStats[memory.contributorId] = {
            role: memory.contributorRole,
            count: 0
          };
        }
        contributorStats[memory.contributorId].count++;
      }

      // Top contributors
      const topContributors = Object.entries(contributorStats)
        .map(([userId, stats]) => ({
          userId,
          role: stats.role,
          memoryCount: stats.count
        }))
        .sort((a, b) => b.memoryCount - a.memoryCount)
        .slice(0, 5);

      return {
        totalMemories: memories.length,
        memoriesByCategory,
        topContributors,
        recentActivity: memories.slice(0, 10) // Most recent 10 memories
      };
    } catch (error) {
      console.error('[InviteBrainMemory] Error getting stats:', error);
      return {
        totalMemories: 0,
        memoriesByCategory: {},
        topContributors: [],
        recentActivity: []
      };
    }
  }

  /**
   * Delete all memories for an invite brain (used when brain is deleted)
   * CAUTION: This is irreversible
   */
  async deleteAllBrainMemories(brainId: number): Promise<boolean> {
    try {
      const memories = await storage.getInviteBrainMemories(brainId);
      
      for (const memory of memories) {
        await storage.deleteInviteBrainMemory(memory.id);
      }
      
      console.log(`[InviteBrainMemory] Deleted ${memories.length} memories for brain ${brainId}`);
      return true;
    } catch (error) {
      console.error('[InviteBrainMemory] Error deleting all brain memories:', error);
      return false;
    }
  }
}

// Export singleton instance
export const inviteBrainMemoryService = new InviteBrainMemoryService();