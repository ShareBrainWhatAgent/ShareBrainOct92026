import { storage } from "./storage";
import { generateAgentResponse, type ChatMessage } from "./openai";
import { listingsService } from "./listingsService";
import type { Agent, Message } from "@shared/schema";

export interface MasterAgentContext {
  userId: string;
  availableAgents: Agent[];
  currentActiveAgent?: Agent;
  conversationHistory: Message[];
}

export class MasterAgentService {
  /**
   * Get all agents available to the user for the master agent to orchestrate
   */
  async getAvailableAgents(userId: string): Promise<Agent[]> {
    const userAgents = await storage.getAgentsByUser(userId);
    const templateAgents = await storage.getTemplateAgents();
    
    // Combine user agents and templates, excluding master agents
    const allAgents = [...userAgents, ...templateAgents].filter(agent => !agent.isMasterAgent);
    
    return allAgents;
  }

  /**
   * Parse user message to detect if they're trying to invoke a specific agent
   */
  detectAgentInvocation(message: string, availableAgents: Agent[]): Agent | null {
    const messageLower = message.toLowerCase();
    const messageWords = messageLower.split(/\s+/);
    
    for (const agent of availableAgents) {
      // 1. Check trigger keywords first (highest priority)
      if (agent.triggerKeywords) {
        const keywords = agent.triggerKeywords.toLowerCase().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (keyword && (messageLower.includes(keyword) || messageWords.includes(keyword))) {
            return agent;
          }
        }
      }
      
      // 2. Check exact agent name matches (case insensitive)
      const agentNameWords = agent.name.toLowerCase().split(/\s+/);
      
      // Check if the message contains the full agent name
      if (agentNameWords.every(word => messageWords.includes(word))) {
        return agent;
      }
      
      // Check if the message starts with the agent name
      if (messageLower.startsWith(agent.name.toLowerCase())) {
        return agent;
      }
    }
    
    return null;
  }

  /**
   * Generate the master agent's system prompt with available agents context
   */
  generateMasterSystemPrompt(availableAgents: Agent[], currentActiveAgent?: Agent): string {
    const agentList = availableAgents.map(agent => 
      `- ${agent.name}: ${agent.description} (Category: ${agent.category})`
    ).join('\n');

    const activeAgentContext = currentActiveAgent 
      ? `\n\nCURRENTLY ACTIVE AGENT: You are currently channeling ${currentActiveAgent.name}. Respond as this agent would, using their personality and expertise. The user can switch to a different agent by saying another agent's name.`
      : '';

    return `You are the Master Agent - a sophisticated AI orchestrator that can access and channel any of the user's available AI agents. You have two main modes:

**DEFAULT MODE**: When no specific agent is active, you act as a helpful general assistant that can:
- Answer general questions using your own knowledge
- Recommend which specialist agent would be best for specific tasks
- Provide overviews of what each agent can do
- Help users discover and navigate their agent ecosystem

**AGENT CHANNELING MODE**: When a user mentions a specific agent name, you immediately switch to channeling that agent's personality, expertise, and response style. You essentially become that agent until the user switches to another one.

**AVAILABLE AGENTS:**
${agentList}

**USAGE INSTRUCTIONS:**
- When a user says an agent's name (like "Happy Hour" or "Language Tutor"), immediately switch to channeling that agent
- When channeling an agent, embody their personality, expertise, and response style completely
- Stay in the channeled agent mode until the user mentions a different agent name
- If asked about switching agents, list the available agents and their capabilities
- Always be helpful and make it easy for users to discover and use their agents

**AGENT SWITCHING SIGNALS:**
- Direct agent name mention (e.g., "Happy Hour", "Python Expert")
- Phrases like "switch to [agent name]", "use [agent name]", "activate [agent name]"
- Questions directed at specific agents (e.g., "Ask the Recipe Chef about pasta")

${activeAgentContext}`;
  }

  /**
   * Process a message through the master agent system
   */
  async processMessage(
    masterAgent: Agent,
    message: string,
    context: MasterAgentContext
  ): Promise<{ response: string; newActiveAgent?: Agent; agentSwitched: boolean }> {
    // First, check if the user is trying to invoke a specific agent
    const invokedAgent = this.detectAgentInvocation(message, context.availableAgents);
    
    // Check if this is a listing query (local business search)
    let listingContext = "";
    if (listingsService.isListingQuery(message)) {
      const location = listingsService.extractLocationFromQuery(message);
      const category = listingsService.extractCategoryFromQuery(message);
      
      const searchResults = await listingsService.searchListings(message, location.city, category);
      if (searchResults.length > 0) {
        listingContext = `\n\nBUSINESS LISTINGS CONTEXT:\n${listingsService.formatListingsForResponse(searchResults, message)}`;
      }
    }
    
    // Convert messages to the format expected by generateAgentResponse
    const messageHistory = context.conversationHistory.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content
    }));
    
    if (invokedAgent) {
      // Agent switch detected
      const switchSystemPrompt = this.generateMasterSystemPrompt(
        context.availableAgents, 
        invokedAgent
      );
      
      // Generate response as the newly invoked agent
      const result = await generateAgentResponse(
        switchSystemPrompt,
        message,
        messageHistory,
        masterAgent.model,
        masterAgent.temperature,
        masterAgent.maxTokens
      );
      
      return {
        response: `*Switching to ${invokedAgent.name}*\n\n${result.content}`,
        newActiveAgent: invokedAgent,
        agentSwitched: true
      };
    }
    
    // No agent switch - continue with current context
    const systemPrompt = this.generateMasterSystemPrompt(
      context.availableAgents,
      context.currentActiveAgent
    ) + listingContext;
    
    const result = await generateAgentResponse(
      systemPrompt,
      message,
      messageHistory,
      masterAgent.model,
      masterAgent.temperature,
      masterAgent.maxTokens
    );
    
    return {
      response: result.content,
      newActiveAgent: context.currentActiveAgent,
      agentSwitched: false
    };
  }

  /**
   * Create a default master agent for a user if they don't have one
   */
  async createMasterAgent(model: string = "gpt-4o"): Promise<Agent> {
    const masterAgent = await storage.createAgent({
      userId: "demo-user",
      name: `Master Agent - ${model}`,
      description: "Orchestrates and channels all your AI agents. Say any agent's name to switch to that agent.",
      category: "Master",
      model,
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: "You are the Master Agent - see generateMasterSystemPrompt for full context.",
      sampleUser: "Switch to Happy Hour",
      sampleAgent: "*Switching to Happy Hour*\n\nHey there! Ready for some cocktail recipes and party tips?",
      status: "active",
      isTemplate: true,
      isMasterAgent: true,
      voiceEnabled: true
    });

    return masterAgent;
  }

  /**
   * Get or create master agent for a user
   */
  async getMasterAgent(model: string = "gpt-4o"): Promise<Agent> {
    const templateAgents = await storage.getTemplateAgents();
    const existingMaster = templateAgents.find(
      agent => agent.isMasterAgent && agent.model === model
    );
    
    if (existingMaster) {
      return existingMaster;
    }
    
    return await this.createMasterAgent(model);
  }
}

export const masterAgentService = new MasterAgentService();
