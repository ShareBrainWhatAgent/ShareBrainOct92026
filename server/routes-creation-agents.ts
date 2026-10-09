/**
 * Creation Agents Routes - Private section for agent creation tools
 * Includes Agent Creation Agent and Development Assistant
 */

import { Express } from 'express';
import { db } from './db';
import { agents, agentWorkspaces } from '../shared/schema';
import { eq, or } from 'drizzle-orm';
import { isAuthenticated } from './googleAuth';

export function registerCreationAgentsRoutes(app: Express) {
  // Get Creation Agents - Private access only
  app.get("/api/creation-agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      // For now, only allow specific admin user access
      // You can modify this logic to control who sees creation agents
      const isAdminUser = req.user?.email === 'tom@colorfulranch.com';
      
      if (!isAdminUser) {
        return res.json([]); // Return empty array for non-admin users
      }

      // Get Creation Agents: Agent Creation Agent (ID 372) and Development Assistant (ID 373)
      const creationAgents = await db
        .select({
          id: agents.id,
          name: agents.name,
          description: agents.description,
          systemPrompt: agents.systemPrompt,
          model: agents.model,
          temperature: agents.temperature,
          maxTokens: agents.maxTokens,
          category: agents.category,
          status: agents.status,
          isPersonal: agents.isPersonal,
          isSystemAgent: agents.isSystemAgent,
          userId: agents.userId,
          sampleUser: agents.sampleUser,
          sampleAgent: agents.sampleAgent,
          websiteUrl: agentWorkspaces.replitUrl,
          websiteSlug: agentWorkspaces.websiteSlug,
        })
        .from(agents)
        .leftJoin(agentWorkspaces, eq(agents.id, agentWorkspaces.agentId))
        .where(or(eq(agents.id, 372), eq(agents.id, 373)))
        .orderBy(agents.id);

      // Sort Creation Agents: Agent Creation Agent (372) first, then Development Assistant (373)
      const sortedAgents = creationAgents.sort((a, b) => {
        if (a.id === 372) return -1;
        if (b.id === 372) return 1;
        if (a.id === 373) return -1;
        if (b.id === 373) return 1;
        return 0;
      });

      res.json(sortedAgents);
    } catch (error) {
      console.error("Error fetching creation agents:", error);
      res.status(500).json({ message: "Failed to fetch creation agents" });
    }
  });

  // Test Claude API connectivity - Public endpoint for status checking
  app.get("/api/creation-agents/test-claude", async (req: any, res) => {
    try {

      const { claudeDirectService } = await import('./claudeDirectService');
      const isConnected = await claudeDirectService.testConnection();
      
      res.json({ 
        connected: isConnected,
        message: isConnected ? "Claude API connection successful" : "Claude API connection failed"
      });
    } catch (error) {
      console.error("Claude API test error:", error);
      res.status(500).json({ 
        connected: false,
        message: "Failed to test Claude API connection",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}