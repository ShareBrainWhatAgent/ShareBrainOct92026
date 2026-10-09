import {
  users, agents, conversations, messages, contacts, conversationParticipants,
  promptEmbeddings, promptAnalytics, apiKeys, agentDocuments, documentChunks, agentListings, personalMemories, friendsMemories, sharedMemories, agentCreationManuals,
  inviteBrains, brainMemberships, brainInvitations, inviteBrainMemories, brainPayments,
  agentCapabilities, agentRankings, userAgentPreferences, agentInteractions, intentDetectionLogs,
  type User, type InsertUser, type UpsertUser,
  type Agent, type InsertAgent,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Contact, type InsertContact,
  type ConversationParticipant, type InsertConversationParticipant,
  type PromptEmbedding, type InsertPromptEmbedding,
  type PromptAnalytics, type InsertPromptAnalytics,
  type ApiKey, type InsertApiKey,
  type AgentDocument, type InsertAgentDocument,
  type DocumentChunk, type InsertDocumentChunk,
  type AgentListing, type InsertAgentListing,
  type PersonalMemory, type InsertPersonalMemory,
  type FriendsMemory, type InsertFriendsMemory,
  type SharedMemory, type InsertSharedMemory,
  type AgentCreationManual, type InsertAgentCreationManual,
  type InviteBrain, type InsertInviteBrain,
  type BrainMembership, type InsertBrainMembership,
  type BrainInvitation, type InsertBrainInvitation,
  type InviteBrainMemory, type InsertInviteBrainMemory,
  type BrainPayment, type InsertBrainPayment,
  type AgentCapability, type InsertAgentCapability,
  type AgentRanking, type InsertAgentRanking,
  type UserAgentPreference, type InsertUserAgentPreference,
  type AgentInteraction, type InsertAgentInteraction,
  type IntentDetectionLog, type InsertIntentDetectionLog
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

export interface IStorage {
  // Users - Updated for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User | undefined>;
  startUserTrial(id: string): Promise<User | undefined>;
  updateUserSubscriptionStatus(id: string, status: string): Promise<User | undefined>;
  getUsersWithExpiredTrials(): Promise<User[]>;
  updateUserGitHubInfo(id: string, githubInfo: {
    githubUsername: string;
    githubAccessToken: string;
    githubConnectedAt: Date;
  }): Promise<User | undefined>;

  // Agents
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUser(userId: string): Promise<Agent[]>;
  getTemplateAgents(): Promise<Agent[]>;
  getPublicAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;

  // Conversations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByAgent(agentId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<boolean>;

  // Messages
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Contacts
  getContactsByUser(userId: string): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  deleteContact(id: number): Promise<boolean>;

  // Conversation Participants
  addConversationParticipants(participants: InsertConversationParticipant[]): Promise<void>;
  getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]>;

  // Stats
  getAgentStats(userId: string): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalConversations: number;
    apiCallsToday: number;
  }>;

  // API Keys
  createApiKey(apiKey: InsertApiKey): Promise<{ key: string; apiKeyData: ApiKey }>;
  getApiKeysByUser(userId: string): Promise<ApiKey[]>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  updateApiKeyUsage(keyHash: string): Promise<void>;
  deleteApiKey(id: number): Promise<boolean>;

  // RAG System - Prompt Embeddings
  storePromptEmbeddings(embeddings: InsertPromptEmbedding[]): Promise<void>;
  getPromptEmbeddings(userId: string, promptType?: string): Promise<PromptEmbedding[]>;
  deletePromptEmbeddings(agentId: number): Promise<void>;

  // RAG System - Analytics
  updatePromptAnalytics(agentId: number, userId: string, promptType: string): Promise<void>;
  getTopPrompts(userId: string, limit: number): Promise<any[]>;

  // RAG System - Document Management
  uploadDocument(document: InsertAgentDocument): Promise<AgentDocument>;
  getAgentDocuments(agentId: number): Promise<AgentDocument[]>;
  getDocumentById(documentId: number): Promise<AgentDocument | undefined>;
  getUserDocuments(userId: string): Promise<AgentDocument[]>;
  deleteDocument(documentId: number): Promise<boolean>;
  updateDocumentStatus(documentId: number, isActive: boolean): Promise<boolean>;
  
  // RAG System - Document Chunks
  storeDocumentChunks(chunks: InsertDocumentChunk[]): Promise<void>;
  getDocumentChunks(documentId: number): Promise<DocumentChunk[]>;
  searchDocumentChunks(agentId: number, query: string, limit?: number): Promise<DocumentChunk[]>;

  // Listings System
  createListing(listing: InsertAgentListing): Promise<AgentListing>;
  getListingsByAgent(agentId: number): Promise<AgentListing[]>;
  getAllListings(status?: string): Promise<AgentListing[]>;
  getListing(id: number): Promise<AgentListing | undefined>;
  updateListingStatus(id: number, status: string, moderatedBy?: string, notes?: string): Promise<AgentListing | undefined>;
  deleteListing(id: number): Promise<boolean>;

  // Personal Memory System
  createPersonalMemory(memory: InsertPersonalMemory): Promise<PersonalMemory>;
  getPersonalMemories(userId: string, agentId: number): Promise<PersonalMemory[]>;
  findPersonalMemoryByKey(userId: string, agentId: number, memoryKey: string): Promise<PersonalMemory | undefined>;
  updatePersonalMemory(id: number, memoryValue: string, originalStatement?: string): Promise<PersonalMemory | undefined>;
  deletePersonalMemory(id: number): Promise<boolean>;

  // Friends Memory System
  createFriendsMemory(memory: InsertFriendsMemory): Promise<FriendsMemory>;
  getFriendsMemories(userId: string, agentId: number): Promise<FriendsMemory[]>;
  findFriendsMemoryByKey(agentId: number, memoryKey: string): Promise<FriendsMemory | undefined>;
  updateFriendsMemory(id: number, memoryValue: string, originalStatement?: string): Promise<FriendsMemory | undefined>;
  deleteFriendsMemory(id: number): Promise<boolean>;

  // Shared Memory System
  createSharedMemory(memory: InsertSharedMemory): Promise<SharedMemory>;
  getSharedMemories(agentId: number): Promise<SharedMemory[]>;
  findSharedMemoryByKey(agentId: number, memoryKey: string): Promise<SharedMemory | undefined>;
  updateSharedMemory(id: number, memoryValue: string, originalStatement?: string): Promise<SharedMemory | undefined>;
  deleteSharedMemory(id: number): Promise<boolean>;

  // Unified Chat System
  getUnifiedContacts(userId: string): Promise<any[]>;
  getUnifiedConversations(userId: string): Promise<any[]>;
  getUnifiedMessages(conversationId: number): Promise<any[]>;
  createUnifiedMessage(message: any): Promise<any>;
  createUnifiedConversation(conversation: any): Promise<any>;
  
  // Agent Creation Manual System
  createAgentCreationManual(manual: InsertAgentCreationManual): Promise<AgentCreationManual>;
  getAgentCreationManuals(): Promise<AgentCreationManual[]>;
  getAgentCreationManualByDomain(domain: string): Promise<AgentCreationManual | undefined>;
  updateAgentCreationManual(id: number, updates: Partial<AgentCreationManual>): Promise<AgentCreationManual | undefined>;
  deleteAgentCreationManual(id: number): Promise<boolean>;

  // Invite Brain System
  createInviteBrain(inviteBrain: InsertInviteBrain): Promise<InviteBrain>;
  getInviteBrain(id: number): Promise<InviteBrain | undefined>;
  getInviteBrainsByCreator(creatorId: string): Promise<InviteBrain[]>;
  getPublicInviteBrains(): Promise<InviteBrain[]>;
  updateInviteBrain(id: number, updates: Partial<InviteBrain>): Promise<InviteBrain | undefined>;
  deleteInviteBrain(id: number): Promise<boolean>;

  // Brain Memberships
  createBrainMembership(membership: InsertBrainMembership): Promise<BrainMembership>;
  getBrainMemberships(brainId: number): Promise<BrainMembership[]>;
  getUserBrainMemberships(userId: string): Promise<BrainMembership[]>;
  getBrainMembership(brainId: number, userId: string): Promise<BrainMembership | undefined>;
  updateBrainMembership(id: number, updates: Partial<BrainMembership>): Promise<BrainMembership | undefined>;
  deleteBrainMembership(id: number): Promise<boolean>;

  // Brain Invitations
  createBrainInvitation(invitation: InsertBrainInvitation): Promise<BrainInvitation>;
  getBrainInvitations(brainId: number): Promise<BrainInvitation[]>;
  getUserBrainInvitations(userId: string): Promise<BrainInvitation[]>;
  getBrainInvitation(id: number): Promise<BrainInvitation | undefined>;
  updateBrainInvitation(id: number, updates: Partial<BrainInvitation>): Promise<BrainInvitation | undefined>;
  deleteBrainInvitation(id: number): Promise<boolean>;

  // Invite Brain Memories
  createInviteBrainMemory(memory: InsertInviteBrainMemory): Promise<InviteBrainMemory>;
  getInviteBrainMemories(brainId: number): Promise<InviteBrainMemory[]>;
  findInviteBrainMemoryByKey(brainId: number, memoryKey: string): Promise<InviteBrainMemory | undefined>;
  updateInviteBrainMemory(id: number, memoryValue: string, originalStatement?: string): Promise<InviteBrainMemory | undefined>;
  deleteInviteBrainMemory(id: number): Promise<boolean>;

  // Brain Payments (placeholder for future)
  createBrainPayment(payment: InsertBrainPayment): Promise<BrainPayment>;
  getBrainPayments(brainId: number): Promise<BrainPayment[]>;
  getUserBrainPayments(userId: string): Promise<BrainPayment[]>;

  // Agent Orchestration System Methods
  createAgentCapability(capability: InsertAgentCapability): Promise<AgentCapability>;
  getAgentCapabilities(agentId: number): Promise<AgentCapability[]>;
  getAgentsByCategory(category: string): Promise<Agent[]>;
  
  createAgentRanking(ranking: InsertAgentRanking): Promise<AgentRanking>;
  getAgentRanking(agentId: number, category: string): Promise<AgentRanking | undefined>;
  updateAgentRanking(agentId: number, category: string, updates: Partial<AgentRanking>): Promise<void>;
  getTopRankedAgentsByCategory(category: string, limit: number): Promise<Agent[]>;
  
  getUserAgentPreference(userId: string, category: string): Promise<UserAgentPreference | undefined>;
  recordUserAgentPreference(userId: string, category: string, agentId: number): Promise<void>;
  
  createAgentInteraction(interaction: InsertAgentInteraction): Promise<AgentInteraction>;
  getAgentInteractions(agentId: number): Promise<AgentInteraction[]>;
  
  createIntentDetectionLog(log: InsertIntentDetectionLog): Promise<IntentDetectionLog>;
  getIntentDetectionLogs(userId: string): Promise<IntentDetectionLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by email (for Google Auth migration)
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        // Update existing user with Google ID and profile data
        const [updatedUser] = await db
          .update(users)
          .set({
            id: userData.id, // Update with Google ID
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updatedUser;
      }
    }

    // Check if this is a completely new user (not just an update)
    const existingUserById = await this.getUser(userData.id);
    const isNewUser = !existingUserById;

    // If no existing user found, create new one
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();



    return user;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async startUserTrial(id: string): Promise<User | undefined> {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    
    const [user] = await db
      .update(users)
      .set({
        trialStartDate: now,
        trialEndDate: trialEnd,
        subscriptionStatus: "trial",
        updatedAt: now,
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSubscriptionStatus(id: string, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersWithExpiredTrials(): Promise<User[]> {
    const now = new Date();
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "trial"),
          sql`${users.trialEndDate} < ${now}`
        )
      );
  }

  async updateUserGitHubInfo(id: string, githubInfo: {
    githubUsername: string;
    githubAccessToken: string;
    githubConnectedAt: Date;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        githubUsername: githubInfo.githubUsername,
        githubAccessToken: githubInfo.githubAccessToken,
        githubConnectedAt: githubInfo.githubConnectedAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAgentsByUser(userId: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.userId, userId));
  }

  async getTemplateAgents(): Promise<Agent[]> {
    return await db.select().from(agents).where(
      and(
        eq(agents.isTemplate, true),
        eq(agents.status, "active")
      )
    );
  }

  async getPublicAgents(): Promise<Agent[]> {
    return await db.select().from(agents).where(
      and(
        eq(agents.isPubliclyVisible, true),
        eq(agents.status, "active")
      )
    );
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db
      .insert(agents)
      .values({
        name: insertAgent.name,
        description: insertAgent.description,
        category: insertAgent.category,
        model: insertAgent.model,
        temperature: insertAgent.temperature ?? 0.7,
        maxTokens: insertAgent.maxTokens ?? 2048,
        systemPrompt: insertAgent.systemPrompt,
        sampleUser: insertAgent.sampleUser ?? null,
        sampleAgent: insertAgent.sampleAgent ?? null,
        status: insertAgent.status ?? "draft",
        isTemplate: insertAgent.isTemplate ?? false,
        isMasterAgent: insertAgent.isMasterAgent ?? false,
        isPersonal: insertAgent.isPersonal ?? false,
        isPrivate: insertAgent.isPrivate ?? false,
        isPubliclyVisible: insertAgent.isPubliclyVisible ?? true,
        triggerKeywords: insertAgent.triggerKeywords ?? null,
        voiceEnabled: insertAgent.voiceEnabled ?? false,
        voiceModel: insertAgent.voiceModel ?? "tts-1",
        voiceType: insertAgent.voiceType ?? "alloy",
        isSystemAgent: insertAgent.isSystemAgent ?? false,
        userId: insertAgent.userId, // Use the provided user ID
      })
      .returning();
    
    // Execute Agent Generation Protocol automatically
    try {
      const { agentGenerationProtocol } = await import("./agentGenerationProtocol");
      await agentGenerationProtocol.executeProtocol(agent);
    } catch (error) {
      console.error("Agent Generation Protocol failed, but agent creation succeeded:", error);
    }
    
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const [agent] = await db
      .update(agents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return agent || undefined;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id)).returning();
    return result.length > 0;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByAgent(agentId: number): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.agentId, agentId));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    return result.length > 0;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        metadata: insertMessage.metadata || null,
      })
      .returning();
    return message;
  }

  async getContactsByUser(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [c] = await db.select().from(contacts).where(eq(contacts.id, id));
    return c || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [c] = await db.insert(contacts).values(contact).returning();
    return c;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id)).returning();
    return result.length > 0;
  }

  async addConversationParticipants(participants: InsertConversationParticipant[]): Promise<void> {
    if (participants.length === 0) return;
    await db.insert(conversationParticipants).values(participants);
  }

  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
  }

  async getAgentStats(userId: string): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalConversations: number;
    apiCallsToday: number;
  }> {
    const userAgents = await db.select().from(agents).where(eq(agents.userId, userId));
    const activeAgents = userAgents.filter(agent => agent.status === "active");
    
    const agentIds = userAgents.map(agent => agent.id);
    const totalConversations = agentIds.length > 0 
      ? await db.select().from(conversations).where(eq(conversations.agentId, agentIds[0])) // Simplified for now
      : [];

    return {
      totalAgents: userAgents.length,
      activeAgents: activeAgents.length,
      totalConversations: totalConversations.length,
      apiCallsToday: Math.floor(Math.random() * 5000) + 1000, // Mock data for now
    };
  }



  // API Keys implementation
  async createApiKey(apiKey: InsertApiKey): Promise<{ key: string; apiKeyData: ApiKey }> {
    try {
      // Generate a secure random key
      const keyBytes = randomBytes(32);
      const key = `sb-${keyBytes.toString('hex')}`;
      
      // Create hash of the key for storage
      const keyHash = createHash('sha256').update(key).digest('hex');
      
      // Insert the API key into database
      const [apiKeyData] = await db
        .insert(apiKeys)
        .values({
          ...apiKey,
          keyHash,
          keyPrefix: key.substring(0, 7), // Store first 7 characters for display
          createdAt: new Date(),
          lastUsed: null,
          usageCount: 0,
        })
        .returning();
      
      return { key, apiKeyData };
    } catch (error) {
      console.error("Error creating API key:", error);
      throw error;
    }
  }

  async getApiKeysByUser(userId: string): Promise<ApiKey[]> {
    try {
      return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
    } catch (error) {
      console.error("Error getting API keys for user:", error);
      return [];
    }
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    try {
      const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
      return apiKey || undefined;
    } catch (error) {
      console.error("Error getting API key by hash:", error);
      return undefined;
    }
  }

  async updateApiKeyUsage(keyHash: string): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({
          lastUsed: new Date(),
          usageCount: sql`${apiKeys.usageCount} + 1`,
        })
        .where(eq(apiKeys.keyHash, keyHash));
    } catch (error) {
      console.error("Error updating API key usage:", error);
    }
  }

  async deleteApiKey(id: number): Promise<boolean> {
    try {
      const result = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting API key:", error);
      return false;
    }
  }

  // RAG System - Prompt Embeddings
  async storePromptEmbeddings(embeddings: InsertPromptEmbedding[]): Promise<void> {
    if (embeddings.length === 0) return;
    
    try {
      await db.insert(promptEmbeddings).values(embeddings);
    } catch (error) {
      console.error("Error storing prompt embeddings:", error);
      throw error;
    }
  }

  async getPromptEmbeddings(userId: string, promptType?: string): Promise<PromptEmbedding[]> {
    try {
      if (promptType) {
        return await db
          .select()
          .from(promptEmbeddings)
          .where(and(
            eq(promptEmbeddings.userId, userId),
            eq(promptEmbeddings.promptType, promptType)
          ));
      } else {
        return await db
          .select()
          .from(promptEmbeddings)
          .where(eq(promptEmbeddings.userId, userId));
      }
    } catch (error) {
      console.error("Error getting prompt embeddings:", error);
      return [];
    }
  }

  async deletePromptEmbeddings(agentId: number): Promise<void> {
    try {
      await db.delete(promptEmbeddings).where(eq(promptEmbeddings.agentId, agentId));
    } catch (error) {
      console.error("Error deleting prompt embeddings:", error);
      throw error;
    }
  }

  // RAG System - Analytics
  async updatePromptAnalytics(agentId: number, userId: string, promptType: string): Promise<void> {
    try {
      // Check if analytics record exists
      const [existing] = await db
        .select()
        .from(promptAnalytics)
        .where(eq(promptAnalytics.agentId, agentId))
        .where(eq(promptAnalytics.userId, userId))
        .where(eq(promptAnalytics.promptType, promptType));

      if (existing) {
        // Update existing record
        await db
          .update(promptAnalytics)
          .set({
            usageCount: existing.usageCount + 1,
            lastUsed: new Date(),
          })
          .where(eq(promptAnalytics.id, existing.id));
      } else {
        // Create new record
        await db.insert(promptAnalytics).values({
          agentId,
          userId,
          promptType,
          usageCount: 1,
          lastUsed: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating prompt analytics:", error);
      throw error;
    }
  }

  async getTopPrompts(userId: string, limit: number): Promise<any[]> {
    try {
      return await db
        .select({
          agentId: promptAnalytics.agentId,
          promptType: promptAnalytics.promptType,
          usageCount: promptAnalytics.usageCount,
          avgRating: promptAnalytics.avgRating,
          lastUsed: promptAnalytics.lastUsed,
        })
        .from(promptAnalytics)
        .where(eq(promptAnalytics.userId, userId))
        .orderBy(promptAnalytics.usageCount)
        .limit(limit);
    } catch (error) {
      console.error("Error getting top prompts:", error);
      return [];
    }
  }

  // Listings System Operations
  async createListing(listing: InsertAgentListing): Promise<AgentListing> {
    const [newListing] = await db
      .insert(agentListings)
      .values({
        ...listing,
        status: "pending", // All new listings start as pending
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newListing;
  }

  async getListingsByAgent(agentId: number): Promise<AgentListing[]> {
    return await db
      .select()
      .from(agentListings)
      .where(and(eq(agentListings.agentId, agentId), eq(agentListings.status, "approved")));
  }

  async getAllListings(status?: string): Promise<AgentListing[]> {
    if (status) {
      return await db
        .select()
        .from(agentListings)
        .where(eq(agentListings.status, status));
    }
    return await db.select().from(agentListings);
  }

  async getListing(id: number): Promise<AgentListing | undefined> {
    const [listing] = await db
      .select()
      .from(agentListings)
      .where(eq(agentListings.id, id));
    return listing || undefined;
  }

  async updateListingStatus(
    id: number, 
    status: string, 
    moderatedBy?: string, 
    notes?: string
  ): Promise<AgentListing | undefined> {
    const [updatedListing] = await db
      .update(agentListings)
      .set({
        status,
        moderatedBy,
        moderationNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(agentListings.id, id))
      .returning();
    return updatedListing || undefined;
  }

  async deleteListing(id: number): Promise<boolean> {
    const result = await db
      .delete(agentListings)
      .where(eq(agentListings.id, id))
      .returning();
    return result.length > 0;
  }

  // Placeholder implementations for missing methods
  async uploadDocument(document: InsertAgentDocument): Promise<AgentDocument> {
    const result = await db.insert(agentDocuments).values(document).returning();
    return result[0];
  }

  async getAgentDocuments(agentId: number): Promise<AgentDocument[]> {
    return db.select().from(agentDocuments).where(eq(agentDocuments.agentId, agentId));
  }

  async getDocumentById(documentId: number): Promise<AgentDocument | undefined> {
    const result = await db.select().from(agentDocuments).where(eq(agentDocuments.id, documentId));
    return result[0];
  }

  async getUserDocuments(userId: string): Promise<AgentDocument[]> {
    return [];
  }

  async deleteDocument(documentId: number): Promise<boolean> {
    return false;
  }

  async updateDocumentStatus(documentId: number, isActive: boolean): Promise<boolean> {
    return false;
  }

  async storeDocumentChunks(chunks: InsertDocumentChunk[]): Promise<void> {
    if (chunks.length > 0) {
      await db.insert(documentChunks).values(chunks);
    }
  }

  async getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
    return await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, documentId))
      .orderBy(documentChunks.chunkIndex);
  }

  async searchDocumentChunks(agentId: number, query: string, limit?: number): Promise<DocumentChunk[]> {
    return [];
  }

  // Personal Memory System Implementation
  async createPersonalMemory(memory: InsertPersonalMemory): Promise<PersonalMemory> {
    const [newMemory] = await db
      .insert(personalMemories)
      .values(memory)
      .returning();
    return newMemory;
  }

  async getPersonalMemories(userId: string, agentId: number): Promise<PersonalMemory[]> {
    return await db
      .select()
      .from(personalMemories)
      .where(and(
        eq(personalMemories.userId, userId),
        eq(personalMemories.agentId, agentId)
      ));
  }

  async findPersonalMemoryByKey(userId: string, agentId: number, memoryKey: string): Promise<PersonalMemory | undefined> {
    const [memory] = await db
      .select()
      .from(personalMemories)
      .where(and(
        eq(personalMemories.userId, userId),
        eq(personalMemories.agentId, agentId),
        eq(personalMemories.memoryKey, memoryKey)
      ));
    return memory || undefined;
  }

  async updatePersonalMemory(id: number, memoryValue: string, originalStatement?: string): Promise<PersonalMemory | undefined> {
    const [updatedMemory] = await db
      .update(personalMemories)
      .set({
        memoryValue,
        originalStatement,
        updatedAt: new Date(),
      })
      .where(eq(personalMemories.id, id))
      .returning();
    return updatedMemory || undefined;
  }

  async deletePersonalMemory(id: number): Promise<boolean> {
    const result = await db
      .delete(personalMemories)
      .where(eq(personalMemories.id, id))
      .returning();
    return result.length > 0;
  }

  // Friends Memory System Implementation
  async createFriendsMemory(memory: InsertFriendsMemory): Promise<FriendsMemory> {
    const [newMemory] = await db
      .insert(friendsMemories)
      .values(memory)
      .returning();
    return newMemory;
  }

  async getFriendsMemories(userId: string, agentId: number): Promise<FriendsMemory[]> {
    // Get all memories for friends of the user for this agent
    // Note: This would need to be implemented with proper friendship checking
    // For now, return empty array until friendship system is fully integrated
    return [];
  }

  async findFriendsMemoryByKey(agentId: number, memoryKey: string): Promise<FriendsMemory | undefined> {
    const [memory] = await db
      .select()
      .from(friendsMemories)
      .where(and(
        eq(friendsMemories.agentId, agentId),
        eq(friendsMemories.memoryKey, memoryKey)
      ));
    return memory || undefined;
  }

  async updateFriendsMemory(id: number, memoryValue: string, originalStatement?: string): Promise<FriendsMemory | undefined> {
    const [updatedMemory] = await db
      .update(friendsMemories)
      .set({
        memoryValue,
        originalStatement,
        updatedAt: new Date(),
      })
      .where(eq(friendsMemories.id, id))
      .returning();
    return updatedMemory || undefined;
  }

  async deleteFriendsMemory(id: number): Promise<boolean> {
    const result = await db
      .delete(friendsMemories)
      .where(eq(friendsMemories.id, id))
      .returning();
    return result.length > 0;
  }

  // Shared Memory System Implementation
  async createSharedMemory(memory: InsertSharedMemory): Promise<SharedMemory> {
    const [newMemory] = await db
      .insert(sharedMemories)
      .values(memory)
      .returning();
    return newMemory;
  }

  async getSharedMemories(agentId: number): Promise<SharedMemory[]> {
    return await db
      .select()
      .from(sharedMemories)
      .where(eq(sharedMemories.agentId, agentId))
      .orderBy(sql`${sharedMemories.createdAt} DESC`);
  }

  async findSharedMemoryByKey(agentId: number, memoryKey: string): Promise<SharedMemory | undefined> {
    const [memory] = await db
      .select()
      .from(sharedMemories)
      .where(and(
        eq(sharedMemories.agentId, agentId),
        eq(sharedMemories.memoryKey, memoryKey)
      ));
    return memory || undefined;
  }

  async updateSharedMemory(id: number, memoryValue: string, originalStatement?: string): Promise<SharedMemory | undefined> {
    const [updatedMemory] = await db
      .update(sharedMemories)
      .set({
        memoryValue,
        originalStatement,
        updatedAt: new Date(),
      })
      .where(eq(sharedMemories.id, id))
      .returning();
    return updatedMemory || undefined;
  }

  async deleteSharedMemory(id: number): Promise<boolean> {
    const result = await db
      .delete(sharedMemories)
      .where(eq(sharedMemories.id, id))
      .returning();
    return result.length > 0;
  }

  // Unified Chat System Methods
  async getUnifiedContacts(userId: string): Promise<any[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId));
  }

  async getUnifiedConversations(userId: string): Promise<any[]> {
    return await db.select().from(conversations).where(eq(conversations.userId, userId));
  }

  async getUnifiedMessages(conversationId: number): Promise<any[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async createUnifiedMessage(message: any): Promise<any> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async createUnifiedConversation(conversation: any): Promise<any> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  // Agent Creation Manual System
  async createAgentCreationManual(manual: InsertAgentCreationManual): Promise<AgentCreationManual> {
    const [newManual] = await db.insert(agentCreationManuals).values(manual).returning();
    return newManual;
  }

  async getAgentCreationManuals(): Promise<AgentCreationManual[]> {
    return await db.select().from(agentCreationManuals).orderBy(agentCreationManuals.name);
  }

  async getAgentCreationManualByDomain(domain: string): Promise<AgentCreationManual | undefined> {
    const [manual] = await db.select().from(agentCreationManuals).where(eq(agentCreationManuals.domain, domain));
    return manual;
  }

  async updateAgentCreationManual(id: number, updates: Partial<AgentCreationManual>): Promise<AgentCreationManual | undefined> {
    const [updatedManual] = await db.update(agentCreationManuals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agentCreationManuals.id, id))
      .returning();
    return updatedManual;
  }

  async deleteAgentCreationManual(id: number): Promise<boolean> {
    const result = await db.delete(agentCreationManuals).where(eq(agentCreationManuals.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private agents: Map<number, Agent>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private contacts: Map<number, Contact>;
  private participants: Map<number, ConversationParticipant>;
  private currentAgentId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentContactId: number;
  private currentParticipantId: number;
  private personalMemories: Map<number, PersonalMemory>;
  private currentPersonalMemoryId: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.contacts = new Map();
    this.participants = new Map();
    this.currentAgentId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentContactId = 1;
    this.currentParticipantId = 1;
    this.personalMemories = new Map();
    this.currentPersonalMemoryId = 1;

    this.initializeTemplateAgents();
  }

  private initializeTemplateAgents() {
    const templateAgents = [
      {
        userId: "demo-user",
        name: "Support Specialist",
        description: "Handles customer inquiries, troubleshooting, and provides product information with empathy and efficiency.",
        category: "Customer Support",
        model: "GPT-4",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: "You are a helpful customer support specialist. Provide empathetic, efficient, and accurate assistance to customers. Always maintain a professional and friendly tone.",
        sampleUser: "I'm having trouble with my account login",
        sampleAgent: "I'd be happy to help you with your login issue. Let me guide you through some troubleshooting steps to get you back into your account.",
        status: "active",
        isTemplate: true,
        isPersonal: false,
        uses: 1200,
        rating: 4.8,
        voiceEnabled: false,
        voiceModel: "tts-1",
        voiceType: "alloy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "demo-user",
        name: "Content Creator",
        description: "Creates engaging blog posts, social media content, and marketing copy tailored to your brand voice.",
        category: "Content Creation",
        model: "Claude-3",
        temperature: 0.8,
        maxTokens: 2048,
        systemPrompt: "You are a creative content writer specializing in engaging, brand-focused content. Create compelling copy that resonates with target audiences while maintaining brand voice and objectives.",
        sampleUser: "Write a social media post about our new product launch",
        sampleAgent: "🚀 Exciting news! We're thrilled to announce the launch of our revolutionary new product that will transform how you work and play. Get ready to experience innovation like never before! #Innovation #ProductLaunch",
        status: "active",
        isTemplate: true,
        isPersonal: false,
        uses: 856,
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "demo-user",
        name: "Data Analyst",
        description: "Analyzes datasets, generates insights, and creates visualizations to help you make data-driven decisions.",
        category: "Data Analysis",
        model: "GPT-4",
        temperature: 0.3,
        maxTokens: 2048,
        systemPrompt: "You are a data analyst expert. Analyze data patterns, generate meaningful insights, and provide actionable recommendations. Always explain your methodology and findings clearly.",
        sampleUser: "Analyze our quarterly sales data",
        sampleAgent: "I'll analyze your quarterly sales data to identify trends, patterns, and opportunities. Please share your data file, and I'll provide comprehensive insights with visualizations and actionable recommendations.",
        status: "active",
        isTemplate: true,
        isPersonal: false,
        uses: 642,
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "demo-user",
        name: "Language Tutor",
        description: "Patient language teacher with cultural insights",
        category: "Research Helper",
        model: "GPT-4",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: "You are an enthusiastic and patient language teacher. Adapt to the student's level, provide vocabulary and example sentences only in the target language unless translations are explicitly requested, correct mistakes gently, and provide cultural context. Ask follow-up questions to keep conversations flowing and make learning engaging through real-world examples.",
        sampleUser: "How do I order food at a restaurant in French?",
        sampleAgent: "Great question! In French restaurants, you can say 'Je voudrais...' (I would like...) to order. For example: 'Je voudrais le steak, s'il vous plaît' (I would like the steak, please). The waiter might ask 'Comment voulez-vous votre steak?' (How would you like your steak?). Want to practice a full restaurant conversation?",
        status: "active",
        isTemplate: true,
        isPersonal: false,
        uses: 512,
        rating: 4.6,
        voiceEnabled: true,
        voiceModel: "tts-1",
        voiceType: "alloy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "demo-user",
        name: "Sales Assistant",
        description: "Qualifies leads, answers product questions, and guides prospects through the sales funnel.",
        category: "Sales",
        model: "GPT-3.5",
        temperature: 0.6,
        maxTokens: 2048,
        systemPrompt: "You are a sales assistant focused on qualifying leads and guiding prospects. Be helpful, informative, but not pushy. Focus on understanding customer needs and providing relevant solutions.",
        sampleUser: "Tell me about your pricing plans",
        sampleAgent: "I'd be happy to explain our pricing options! To recommend the best plan for you, could you tell me a bit about your business size and primary needs? This will help me suggest the most suitable package.",
        status: "active",
        isTemplate: true,
        isPersonal: false,
        uses: 923,
        rating: 4.5,
        voiceEnabled: false,
        voiceModel: "tts-1",
        voiceType: "alloy",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    templateAgents.forEach(agent => {
      const id = this.currentAgentId++;
      this.agents.set(id, { 
        ...agent, 
        id,
        voiceEnabled: agent.voiceEnabled ?? false,
        voiceModel: agent.voiceModel ?? "tts-1",
        voiceType: agent.voiceType ?? "alloy"
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = this.users.get(user.id);
    const newUser = {
      ...existing,
      ...user,
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    } as User;
    this.users.set(id, updated);
    return updated;
  }

  async updateUserStripeInfo(
    id: string,
    customerId: string,
    subscriptionId: string,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = {
      ...user,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    } as User;
    this.users.set(id, updated);
    return updated;
  }

  // Agents
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentsByUser(userId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.userId === userId,
    );
  }

  async getTemplateAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.isTemplate === true,
    );
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = {
      id,
      userId: insertAgent.userId ?? "demo-user",
      name: insertAgent.name,
      description: insertAgent.description,
      category: insertAgent.category,
      model: insertAgent.model,
      temperature: insertAgent.temperature ?? 0.7,
      maxTokens: insertAgent.maxTokens ?? 2048,
      systemPrompt: insertAgent.systemPrompt ?? "",
      sampleUser: insertAgent.sampleUser ?? null,
      sampleAgent: insertAgent.sampleAgent ?? null,
      status: insertAgent.status ?? "draft",
      isTemplate: insertAgent.isTemplate ?? false,
      isMasterAgent: insertAgent.isMasterAgent ?? false,
      isPersonal: insertAgent.isPersonal ?? false,
      isPrivate: insertAgent.isPrivate ?? false,
      triggerKeywords: insertAgent.triggerKeywords ?? null,
      documentSearchMode: insertAgent.documentSearchMode ?? "documents_memory_and_general",
      uses: 0,
      rating: 0,
      voiceEnabled: insertAgent.voiceEnabled ?? false,
      voiceModel: insertAgent.voiceModel ?? "tts-1",
      voiceType: insertAgent.voiceType ?? "alloy",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = { ...agent, ...updates, updatedAt: new Date() };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Conversations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByAgent(agentId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.agentId === agentId,
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = { 
      ...insertConversation, 
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    return this.conversations.delete(id);
  }

  // Messages
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      metadata: insertMessage.metadata || null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getContactsByUser(userId: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(c => c.userId === userId);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const c: Contact = { ...contact, id, createdAt: new Date() } as Contact;
    this.contacts.set(id, c);
    return c;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async addConversationParticipants(participants: InsertConversationParticipant[]): Promise<void> {
    for (const part of participants) {
      const id = this.currentParticipantId++;
      this.participants.set(id, { ...part, id });
    }
  }

  async getConversationParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return Array.from(this.participants.values()).filter(
      p => p.conversationId === conversationId,
    );
  }

  // Stats
  async getAgentStats(userId: string): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalConversations: number;
    apiCallsToday: number;
  }> {
    const userAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.userId === userId,
    );
    
    const activeAgents = userAgents.filter(
      (agent) => agent.status === "active",
    );

    const totalConversations = Array.from(this.conversations.values()).filter(
      (conversation) => {
        const agent = this.agents.get(conversation.agentId);
        return agent && agent.userId === userId;
      }
    );

    // Mock API calls for today - in real implementation this would track actual usage
    const apiCallsToday = Math.floor(Math.random() * 5000) + 1000;

    return {
      totalAgents: userAgents.length,
      activeAgents: activeAgents.length,
      totalConversations: totalConversations.length,
      apiCallsToday,
    };
  }

  // API Keys - Stub implementations for MemStorage
  async createApiKey(apiKey: InsertApiKey): Promise<{ key: string; apiKeyData: ApiKey }> {
    throw new Error("API key functionality not available in memory storage");
  }

  async getApiKeysByUser(userId: string): Promise<ApiKey[]> {
    return [];
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    return undefined;
  }

  async updateApiKeyUsage(keyHash: string): Promise<void> {
    // No-op for memory storage
  }

  async deleteApiKey(id: number): Promise<boolean> {
    return false;
  }

  // // RAG System - Stub implementations for MemStorage
  // async storePromptEmbeddings(embeddings: InsertPromptEmbedding[]): Promise<void> {
  //   console.log("RAG functionality not available in memory storage");
  // }

  // async deletePromptEmbeddings(agentId: number): Promise<void> {
  //   // No-op for memory storage
  // }

  // async updatePromptAnalytics(agentId: number, userId: string, promptType: string): Promise<void> {
  //   // No-op for memory storage
  // }

  // Personal Memory System
  async createPersonalMemory(memory: InsertPersonalMemory): Promise<PersonalMemory> {
    const id = this.currentPersonalMemoryId++;
    const newMemory: PersonalMemory = {
      ...memory,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PersonalMemory;
    this.personalMemories.set(id, newMemory);
    return newMemory;
  }

  async getPersonalMemories(userId: string, agentId: number): Promise<PersonalMemory[]> {
    return Array.from(this.personalMemories.values()).filter(
      m => m.userId === userId && m.agentId === agentId
    );
  }

  async findPersonalMemoryByKey(userId: string, agentId: number, memoryKey: string): Promise<PersonalMemory | undefined> {
    for (const mem of this.personalMemories.values()) {
      if (mem.userId === userId && mem.agentId === agentId && mem.memoryKey === memoryKey) {
        return mem;
      }
    }
    return undefined;
  }

  async updatePersonalMemory(id: number, memoryValue: string, originalStatement?: string): Promise<PersonalMemory | undefined> {
    const existing = this.personalMemories.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      memoryValue,
      originalStatement,
      updatedAt: new Date(),
    } as PersonalMemory;
    this.personalMemories.set(id, updated);
    return updated;
  }

  async deletePersonalMemory(id: number): Promise<boolean> {
    return this.personalMemories.delete(id);
  }

  // RAG System: Prompt embeddings (stub implementations for memory storage)
  async storePromptEmbeddings(embeddings: InsertPromptEmbedding[]): Promise<void> {
    // Memory storage stub - in production, this would be implemented
    console.log("Storing prompt embeddings (memory storage stub)");
  }

  async getPromptEmbeddings(userId: string, promptType?: string): Promise<PromptEmbedding[]> {
    // Memory storage stub - return empty array
    return [];
  }

  async deletePromptEmbeddings(agentId: number): Promise<void> {
    // Memory storage stub
    console.log("Deleting prompt embeddings (memory storage stub)");
  }

  async updatePromptAnalytics(agentId: number, userId: string, promptType: string): Promise<void> {
    // Memory storage stub
    console.log("Updating prompt analytics (memory storage stub)");
  }

  async getTopPrompts(userId: string, limit: number): Promise<any[]> {
    // Memory storage stub - return empty array
    return [];
  }

  // RAG System: Document management (stub implementations)
  async uploadDocument(document: InsertAgentDocument): Promise<AgentDocument> {
    // Memory storage stub - return basic document structure
    const docId = Date.now();
    return {
      id: docId,
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AgentDocument;
  }

  async getAgentDocuments(agentId: number): Promise<AgentDocument[]> {
    // Memory storage stub - return empty array
    return [];
  }

  async getDocumentById(documentId: number): Promise<AgentDocument | undefined> {
    // Memory storage stub - return undefined
    return undefined;
  }

  async getUserDocuments(userId: string): Promise<AgentDocument[]> {
    // Memory storage stub - return empty array
    return [];
  }

  async deleteDocument(documentId: number): Promise<boolean> {
    // Memory storage stub - return true
    return true;
  }

  async updateDocumentStatus(documentId: number, isActive: boolean): Promise<boolean> {
    // Memory storage stub - return true
    return true;
  }

  // RAG System: Document chunks (stub implementations)
  async storeDocumentChunks(chunks: InsertDocumentChunk[]): Promise<void> {
    // Memory storage stub
    console.log("Storing document chunks (memory storage stub)");
  }

  async getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
    // Memory storage stub - return empty array
    return [];
  }

  async searchDocumentChunks(agentId: number, query: string, limit?: number): Promise<DocumentChunk[]> {
    // Memory storage stub - return empty array
    return [];
  }

  // Agent Creation Manual System (stub implementations)
  async createAgentCreationManual(manual: InsertAgentCreationManual): Promise<AgentCreationManual> {
    // Memory storage stub - return basic structure
    const id = Date.now();
    return {
      id,
      ...manual,
      createdAt: new Date(),
      updatedAt: new Date()
    } as AgentCreationManual;
  }

  async getAgentCreationManuals(): Promise<AgentCreationManual[]> {
    // Memory storage stub - return empty array
    return [];
  }

  async getAgentCreationManualByDomain(domain: string): Promise<AgentCreationManual | undefined> {
    // Memory storage stub - return undefined
    return undefined;
  }

  async updateAgentCreationManual(id: number, updates: Partial<AgentCreationManual>): Promise<AgentCreationManual | undefined> {
    // Memory storage stub - return undefined
    return undefined;
  }

  async deleteAgentCreationManual(id: number): Promise<boolean> {
    // Memory storage stub - return true
    return true;
  }

  // ===============================================
  // INVITE BRAIN SYSTEM IMPLEMENTATIONS (Phase 1)
  // ===============================================

  // Invite Brain Management
  async createInviteBrain(inviteBrainData: InsertInviteBrain): Promise<InviteBrain> {
    const [newInviteBrain] = await db
      .insert(inviteBrains)
      .values(inviteBrainData)
      .returning();
    return newInviteBrain;
  }

  async getInviteBrain(id: number): Promise<InviteBrain | undefined> {
    const [inviteBrain] = await db
      .select()
      .from(inviteBrains)
      .where(eq(inviteBrains.id, id));
    return inviteBrain || undefined;
  }

  async getInviteBrainsByCreator(creatorId: string): Promise<InviteBrain[]> {
    return await db
      .select()
      .from(inviteBrains)
      .where(eq(inviteBrains.creatorId, creatorId))
      .orderBy(sql`${inviteBrains.createdAt} DESC`);
  }

  async getPublicInviteBrains(): Promise<InviteBrain[]> {
    return await db
      .select()
      .from(inviteBrains)
      .where(and(
        eq(inviteBrains.brainType, "public_invite"),
        eq(inviteBrains.isActive, true)
      ))
      .orderBy(sql`${inviteBrains.createdAt} DESC`);
  }

  async updateInviteBrain(id: number, updates: Partial<InviteBrain>): Promise<InviteBrain | undefined> {
    const [updatedInviteBrain] = await db
      .update(inviteBrains)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(inviteBrains.id, id))
      .returning();
    return updatedInviteBrain || undefined;
  }

  async deleteInviteBrain(id: number): Promise<boolean> {
    const result = await db
      .delete(inviteBrains)
      .where(eq(inviteBrains.id, id))
      .returning();
    return result.length > 0;
  }

  // Brain Membership Management
  async createBrainMembership(membershipData: InsertBrainMembership): Promise<BrainMembership> {
    const [newMembership] = await db
      .insert(brainMemberships)
      .values(membershipData)
      .returning();
    return newMembership;
  }

  async getBrainMemberships(brainId: number): Promise<BrainMembership[]> {
    return await db
      .select()
      .from(brainMemberships)
      .where(eq(brainMemberships.brainId, brainId))
      .orderBy(sql`${brainMemberships.joinedAt} DESC`);
  }

  async getUserBrainMemberships(userId: string): Promise<BrainMembership[]> {
    return await db
      .select()
      .from(brainMemberships)
      .where(eq(brainMemberships.userId, userId))
      .orderBy(sql`${brainMemberships.joinedAt} DESC`);
  }

  async getBrainMembership(brainId: number, userId: string): Promise<BrainMembership | undefined> {
    const [membership] = await db
      .select()
      .from(brainMemberships)
      .where(and(
        eq(brainMemberships.brainId, brainId),
        eq(brainMemberships.userId, userId)
      ));
    return membership || undefined;
  }

  async updateBrainMembership(id: number, updates: Partial<BrainMembership>): Promise<BrainMembership | undefined> {
    const [updatedMembership] = await db
      .update(brainMemberships)
      .set(updates)
      .where(eq(brainMemberships.id, id))
      .returning();
    return updatedMembership || undefined;
  }

  async deleteBrainMembership(id: number): Promise<boolean> {
    const result = await db
      .delete(brainMemberships)
      .where(eq(brainMemberships.id, id))
      .returning();
    return result.length > 0;
  }

  // Brain Invitation Management
  async createBrainInvitation(invitationData: InsertBrainInvitation): Promise<BrainInvitation> {
    const [newInvitation] = await db
      .insert(brainInvitations)
      .values(invitationData)
      .returning();
    return newInvitation;
  }

  async getBrainInvitations(brainId: number): Promise<BrainInvitation[]> {
    return await db
      .select()
      .from(brainInvitations)
      .where(eq(brainInvitations.brainId, brainId))
      .orderBy(sql`${brainInvitations.createdAt} DESC`);
  }

  async getUserBrainInvitations(userId: string): Promise<BrainInvitation[]> {
    return await db
      .select()
      .from(brainInvitations)
      .where(eq(brainInvitations.inviteeUserId, userId))
      .orderBy(sql`${brainInvitations.createdAt} DESC`);
  }

  async getBrainInvitation(id: number): Promise<BrainInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(brainInvitations)
      .where(eq(brainInvitations.id, id));
    return invitation || undefined;
  }

  async updateBrainInvitation(id: number, updates: Partial<BrainInvitation>): Promise<BrainInvitation | undefined> {
    const [updatedInvitation] = await db
      .update(brainInvitations)
      .set(updates)
      .where(eq(brainInvitations.id, id))
      .returning();
    return updatedInvitation || undefined;
  }

  async deleteBrainInvitation(id: number): Promise<boolean> {
    const result = await db
      .delete(brainInvitations)
      .where(eq(brainInvitations.id, id))
      .returning();
    return result.length > 0;
  }

  // Invite Brain Memory System
  async createInviteBrainMemory(memoryData: InsertInviteBrainMemory): Promise<InviteBrainMemory> {
    const [newMemory] = await db
      .insert(inviteBrainMemories)
      .values(memoryData)
      .returning();
    return newMemory;
  }

  async getInviteBrainMemories(brainId: number): Promise<InviteBrainMemory[]> {
    return await db
      .select()
      .from(inviteBrainMemories)
      .where(eq(inviteBrainMemories.brainId, brainId))
      .orderBy(sql`${inviteBrainMemories.createdAt} DESC`);
  }

  async findInviteBrainMemoryByKey(brainId: number, memoryKey: string): Promise<InviteBrainMemory | undefined> {
    const [memory] = await db
      .select()
      .from(inviteBrainMemories)
      .where(and(
        eq(inviteBrainMemories.brainId, brainId),
        eq(inviteBrainMemories.memoryKey, memoryKey)
      ));
    return memory || undefined;
  }

  async updateInviteBrainMemory(id: number, memoryValue: string, originalStatement?: string): Promise<InviteBrainMemory | undefined> {
    const [updatedMemory] = await db
      .update(inviteBrainMemories)
      .set({
        memoryValue,
        originalStatement,
        updatedAt: new Date(),
      })
      .where(eq(inviteBrainMemories.id, id))
      .returning();
    return updatedMemory || undefined;
  }

  async deleteInviteBrainMemory(id: number): Promise<boolean> {
    const result = await db
      .delete(inviteBrainMemories)
      .where(eq(inviteBrainMemories.id, id))
      .returning();
    return result.length > 0;
  }

  // Brain Payment Management (placeholder for future implementation)
  async createBrainPayment(paymentData: InsertBrainPayment): Promise<BrainPayment> {
    const [newPayment] = await db
      .insert(brainPayments)
      .values(paymentData)
      .returning();
    return newPayment;
  }

  async getBrainPayments(brainId: number): Promise<BrainPayment[]> {
    return await db
      .select()
      .from(brainPayments)
      .where(eq(brainPayments.brainId, brainId))
      .orderBy(sql`${brainPayments.createdAt} DESC`);
  }

  async getUserBrainPayments(userId: string): Promise<BrainPayment[]> {
    return await db
      .select()
      .from(brainPayments)
      .where(eq(brainPayments.userId, userId))
      .orderBy(sql`${brainPayments.createdAt} DESC`);
  }

  // ==========================================
  // AGENT ORCHESTRATION SYSTEM STORAGE METHODS
  // ==========================================

  // Agent Capabilities
  async createAgentCapability(capabilityData: InsertAgentCapability): Promise<AgentCapability> {
    const [newCapability] = await db
      .insert(agentCapabilities)
      .values(capabilityData)
      .returning();
    return newCapability;
  }

  async getAgentCapabilities(agentId: number): Promise<AgentCapability[]> {
    return await db
      .select()
      .from(agentCapabilities)
      .where(and(
        eq(agentCapabilities.agentId, agentId),
        eq(agentCapabilities.isActive, true)
      ))
      .orderBy(agentCapabilities.proficiencyLevel);
  }

  async getAgentsByCategory(category: string): Promise<Agent[]> {
    const capabilityAgents = await db
      .select({ agent: agents })
      .from(agents)
      .innerJoin(agentCapabilities, eq(agents.id, agentCapabilities.agentId))
      .where(and(
        eq(agentCapabilities.category, category),
        eq(agentCapabilities.isActive, true),
        eq(agents.status, "active")
      ))
      .orderBy(agentCapabilities.proficiencyLevel);
    
    return capabilityAgents.map(row => row.agent);
  }

  // Agent Rankings
  async createAgentRanking(rankingData: InsertAgentRanking): Promise<AgentRanking> {
    const [newRanking] = await db
      .insert(agentRankings)
      .values(rankingData)
      .returning();
    return newRanking;
  }

  async getAgentRanking(agentId: number, category: string): Promise<AgentRanking | undefined> {
    const [ranking] = await db
      .select()
      .from(agentRankings)
      .where(and(
        eq(agentRankings.agentId, agentId),
        eq(agentRankings.category, category)
      ));
    return ranking || undefined;
  }

  async updateAgentRanking(agentId: number, category: string, updates: Partial<AgentRanking>): Promise<void> {
    const existingRanking = await this.getAgentRanking(agentId, category);
    
    if (existingRanking) {
      // Update existing ranking
      await db
        .update(agentRankings)
        .set({
          ...updates,
          lastUpdated: new Date(),
        })
        .where(and(
          eq(agentRankings.agentId, agentId),
          eq(agentRankings.category, category)
        ));
    } else {
      // Create new ranking
      await this.createAgentRanking({
        agentId,
        category,
        qualityScore: updates.qualityScore || 5.0,
        userPreferenceScore: updates.userPreferenceScore || 5.0,
        totalUses: updates.totalUses || 0,
        averageRating: updates.averageRating || 0,
        responseTime: updates.responseTime || 0,
        continuationRate: updates.continuationRate || 0,
      });
    }
  }

  async getTopRankedAgentsByCategory(category: string, limit: number): Promise<Agent[]> {
    const rankedAgents = await db
      .select({ agent: agents, ranking: agentRankings })
      .from(agents)
      .innerJoin(agentRankings, eq(agents.id, agentRankings.agentId))
      .where(and(
        eq(agentRankings.category, category),
        eq(agents.status, "active")
      ))
      .orderBy(
        sql`(${agentRankings.qualityScore} * 0.4 + ${agentRankings.userPreferenceScore} * 0.3 + ${agentRankings.averageRating} * 0.2 + ${agentRankings.continuationRate} * 0.1) DESC`
      )
      .limit(limit);
    
    return rankedAgents.map(row => row.agent);
  }

  // User Agent Preferences
  async getUserAgentPreference(userId: string, category: string): Promise<UserAgentPreference | undefined> {
    const [preference] = await db
      .select()
      .from(userAgentPreferences)
      .where(and(
        eq(userAgentPreferences.userId, userId),
        eq(userAgentPreferences.category, category)
      ))
      .orderBy(sql`${userAgentPreferences.lastSelected} DESC`);
    return preference || undefined;
  }

  async recordUserAgentPreference(userId: string, category: string, agentId: number): Promise<void> {
    const existingPreference = await this.getUserAgentPreference(userId, category);
    
    if (existingPreference && existingPreference.preferredAgentId === agentId) {
      // Update existing preference
      await db
        .update(userAgentPreferences)
        .set({
          selectionCount: existingPreference.selectionCount + 1,
          confidence: Math.min(existingPreference.confidence + 0.1, 1.0),
          lastSelected: new Date(),
        })
        .where(eq(userAgentPreferences.id, existingPreference.id));
    } else {
      // Create new preference or switch preference
      if (existingPreference) {
        // Delete old preference for this category
        await db
          .delete(userAgentPreferences)
          .where(eq(userAgentPreferences.id, existingPreference.id));
      }
      
      // Create new preference
      await db
        .insert(userAgentPreferences)
        .values({
          userId,
          category,
          preferredAgentId: agentId,
          confidence: 0.7, // Start with moderate confidence
          selectionCount: 1,
        });
    }
  }

  // Agent Interactions
  async createAgentInteraction(interactionData: InsertAgentInteraction): Promise<AgentInteraction> {
    const [newInteraction] = await db
      .insert(agentInteractions)
      .values(interactionData)
      .returning();
    return newInteraction;
  }

  async getAgentInteractions(agentId: number): Promise<AgentInteraction[]> {
    return await db
      .select()
      .from(agentInteractions)
      .where(eq(agentInteractions.targetAgentId, agentId))
      .orderBy(sql`${agentInteractions.createdAt} DESC`);
  }

  // Intent Detection Logs
  async createIntentDetectionLog(logData: InsertIntentDetectionLog): Promise<IntentDetectionLog> {
    const [newLog] = await db
      .insert(intentDetectionLogs)
      .values(logData)
      .returning();
    return newLog;
  }

  async getIntentDetectionLogs(userId: string): Promise<IntentDetectionLog[]> {
    return await db
      .select()
      .from(intentDetectionLogs)
      .where(eq(intentDetectionLogs.userId, userId))
      .orderBy(sql`${intentDetectionLogs.createdAt} DESC`)
      .limit(100);
  }
}

export const storage = new DatabaseStorage();
