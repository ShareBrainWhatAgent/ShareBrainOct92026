import { apiRequest } from "./queryClient";
import type { Agent, InsertAgent, Message, User } from "@shared/schema";

export const agentApi = {
  // Get all user agents
  getAgents: async (): Promise<Agent[]> => {
    const response = await apiRequest("GET", "/api/agents");
    return response.json();
  },

  // Get agent by ID
  getAgent: async (id: number): Promise<Agent> => {
    const response = await apiRequest("GET", `/api/agents/${id}`);
    return response.json();
  },

  // Create new agent
  createAgent: async (agent: InsertAgent): Promise<Agent> => {
    const response = await apiRequest("POST", "/api/agents", agent);
    return response.json();
  },

  // Update agent
  updateAgent: async (id: number, updates: Partial<Agent>): Promise<Agent> => {
    const response = await apiRequest("PUT", `/api/agents/${id}`, updates);
    return response.json();
  },

  // Delete agent
  deleteAgent: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/agents/${id}`);
  },

  // Get template agents
  getTemplates: async (): Promise<Agent[]> => {
    const response = await apiRequest("GET", "/api/agents/templates");
    return response.json();
  },
};

export const statsApi = {
  // Get user stats
  getStats: async (): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalConversations: number;
    apiCallsToday: number;
  }> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },
};

export const chatApi = {
  // Send chat message
  sendMessage: async (params: {
    agentId: number;
    message: string;
    conversationId?: number;
  }): Promise<{
    message: Message;
    conversationId: number;
  }> => {
    const response = await apiRequest("POST", "/api/chat", params);
    return response.json();
  },

  // Get conversation messages
  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await apiRequest("GET", `/api/conversations/${conversationId}/messages`);
    return response.json();
  },
};

export const conversationApi = {
  getParticipants: async (
    conversationId: number,
  ): Promise<{ agent: Agent | null; user: User | null }> => {
    const response = await apiRequest(
      "GET",
      `/api/conversations/${conversationId}/participants`,
    );
    return response.json();
  },
};

export const userApi = {
  // Get current user info
  getCurrentUser: async () => {
    const response = await apiRequest("GET", "/api/auth/user");
    return response.json();
  },
};
