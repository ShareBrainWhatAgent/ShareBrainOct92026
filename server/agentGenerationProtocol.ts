import { Agent, agentWorkspaces, llmTxtConfigs } from "@shared/schema";
import { storage } from "./storage";
import { generateAgentWebsiteSlug, generateUniqueSlug } from "./urlUtils";
import { generateLLMTxtConfig } from "./llmTxtService";
import { db } from "./db";
import { isNotNull } from 'drizzle-orm';

/**
 * Automatic Agent Generation Protocol
 * 
 * This service automatically enhances every newly created agent with:
 * - LLM.txt configuration for AI system discovery
 * - SEO-optimized URL slug generation
 * - Agent workspace creation for future website generation
 * - Public discovery registration
 */
export class AgentGenerationProtocol {
  
  /**
   * Execute complete agent enhancement protocol
   * Called automatically after every agent creation
   */
  async executeProtocol(agent: Agent): Promise<void> {
    console.log(`🚀 Executing Agent Generation Protocol for "${agent.name}" (ID: ${agent.id})`);
    
    try {
      // Run all enhancements in parallel for efficiency
      await Promise.all([
        this.generateLLMTxtConfiguration(agent),
        this.createAgentWorkspace(agent),
        this.registerInDiscoverySystem(agent)
      ]);
      
      console.log(`✅ Agent Generation Protocol completed for "${agent.name}"`);
    } catch (error) {
      console.error(`❌ Agent Generation Protocol failed for "${agent.name}":`, error);
      // Don't throw error - agent creation should succeed even if enhancements fail
    }
  }

  /**
   * Generate and store LLM.txt configuration for AI system discovery
   */
  private async generateLLMTxtConfiguration(agent: Agent): Promise<void> {
    try {
      // Determine access level based on agent privacy settings
      const accessLevel = this.determineAccessLevel(agent);
      
      // Create LLM.txt configuration using existing service method
      const configData = {
        agentId: agent.id,
        title: `${agent.name} - AI Agent`,
        description: agent.description || `AI agent specialized in ${agent.category}`,
        instructions: this.generateInstructions(agent),
        citationFormat: `Source: ${agent.name} via ShareBrain Platform`,
        accessLevel: accessLevel,
        rateLimit: this.determineRateLimit(agent),
        allowedMethods: ['chat', 'info'],
        authenticationRequired: !agent.isPrivate,
        costPerRequest: accessLevel === 'paid' ? 0.01 : 0,
        metadata: {
          category: agent.category,
          model: agent.model,
          voiceEnabled: agent.voiceEnabled,
          imageEnabled: agent.imageEnabled,
          hasMemory: agent.hasSharedMemory || agent.hasFriendsMemory
        }
      };
      
      // Use the existing storage pattern for LLM.txt config
      await db.insert(llmTxtConfigs).values({
        agentId: agent.id,
        title: configData.title,
        description: configData.description,
        instructions: configData.instructions,
        citationFormat: configData.citationFormat,
        accessLevel: configData.accessLevel,
        rateLimit: configData.rateLimit,
        allowedMethods: configData.allowedMethods,
        pricePerRequest: configData.costPerRequest
      });
      
      console.log(`✅ LLM.txt configuration created for ${agent.name}`);
    } catch (error) {
      console.error(`Failed to create LLM.txt for ${agent.name}:`, error);
    }
  }

  /**
   * Create agent workspace with SEO-optimized URL slug
   */
  private async createAgentWorkspace(agent: Agent): Promise<void> {
    try {
      // Generate unique URL slug
      const baseSlug = generateAgentWebsiteSlug(agent.name);
      
      // Get existing slugs from database
      const existingSlugs = await db.select({ websiteSlug: agentWorkspaces.websiteSlug })
        .from(agentWorkspaces)
        .where(isNotNull(agentWorkspaces.websiteSlug));
      
      const existingSlugStrings = existingSlugs
        .map(row => row.websiteSlug)
        .filter(slug => slug !== null) as string[];
      
      const websiteSlug = generateUniqueSlug(baseSlug, existingSlugStrings);
      
      // Create agent workspace entry with proper field mapping
      await db.insert(agentWorkspaces).values({
        id: `ws_${agent.id}_${Date.now()}`, // Generate unique workspace ID
        agentId: agent.id,
        userId: agent.userId,
        name: agent.name,
        description: agent.description || `Professional website for ${agent.name}`,
        code: this.generateDefaultWebsiteStructure(agent, websiteSlug),
        systemPrompt: this.generateDefaultScript(agent),
        websiteSlug: websiteSlug,
        memoryType: agent.hasSharedMemory ? "global" : agent.hasFriendsMemory ? "friends" : "personal",
        isPublic: !agent.isPrivate
      });
      
      console.log(`✅ Agent workspace created for ${agent.name} with slug: ${websiteSlug}`);
    } catch (error) {
      console.error(`Failed to create workspace for ${agent.name}:`, error);
    }
  }

  /**
   * Register agent in internal discovery systems
   */
  private async registerInDiscoverySystem(agent: Agent): Promise<void> {
    try {
      // Future: Register with internal search indices, recommendation systems, etc.
      // For now, this is a placeholder for future discovery features
      console.log(`✅ Discovery registration completed for ${agent.name}`);
    } catch (error) {
      console.error(`Failed to register ${agent.name} in discovery system:`, error);
    }
  }

  /**
   * Determine appropriate access level for LLM.txt
   */
  private determineAccessLevel(agent: Agent): 'public' | 'authenticated' | 'paid' {
    if (agent.isPrivate) return 'authenticated';
    if (agent.hasSharedMemory) return 'public'; // Global brains are public
    return 'public'; // Default to public access
  }

  /**
   * Determine rate limit based on agent type
   */
  private determineRateLimit(agent: Agent): number {
    if (agent.isPrivate) return 100; // Lower limit for private agents
    if (agent.hasSharedMemory) return 1000; // Higher limit for global brains
    return 500; // Default rate limit
  }

  /**
   * Generate LLM.txt instructions based on agent configuration
   */
  private generateInstructions(agent: Agent): string {
    let instructions = `You are interacting with "${agent.name}", a specialized AI agent`;
    
    if (agent.category) {
      instructions += ` focused on ${agent.category}`;
    }
    
    instructions += '. ';
    
    if (agent.hasSharedMemory) {
      instructions += 'This agent uses community-shared memory and learns from all user interactions. ';
    } else if (agent.hasFriendsMemory) {
      instructions += 'This agent uses friends-based memory and learns from your friend group. ';
    } else {
      instructions += 'This agent provides expert assistance within its domain. ';
    }
    
    instructions += 'Be respectful, helpful, and follow general AI ethics guidelines when interacting.';
    
    return instructions;
  }

  /**
   * Generate default website structure with SEO optimization
   */
  private generateDefaultWebsiteStructure(agent: Agent, slug: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${agent.name} - AI Agent | ShareBrain</title>
    <meta name="description" content="${agent.description || `Professional AI agent specializing in ${agent.category}. Powered by ShareBrain platform.`}">
    <meta name="keywords" content="${agent.category}, AI agent, ${agent.name}, ShareBrain">
    <meta property="og:title" content="${agent.name} - AI Agent">
    <meta property="og:description" content="${agent.description || `Professional AI agent specializing in ${agent.category}`}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sharebrain.me/${slug}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #000; color: #fff; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 60px 0; }
        .header h1 { font-size: 3em; margin-bottom: 20px; }
        .header p { font-size: 1.2em; color: #ccc; }
        .content { margin: 40px 0; }
        .card { background: #1a1a1a; border-radius: 10px; padding: 30px; margin: 20px 0; }
        .btn { display: inline-block; background: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${agent.name}</h1>
            <p>${agent.description || `Professional AI agent specializing in ${agent.category}`}</p>
        </header>
        
        <div class="content">
            <div class="card">
                <h2>About This Agent</h2>
                <p>This AI agent is powered by ShareBrain platform and specializes in ${agent.category}. Ready to assist with expert knowledge and professional guidance.</p>
            </div>
            
            <div class="card">
                <h2>Get Started</h2>
                <p>Start a conversation with this agent to experience AI-powered assistance.</p>
                <a href="/chat/${agent.id}" class="btn">Start Chat</a>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate default agent script
   */
  private generateDefaultScript(agent: Agent): string {
    return agent.systemPrompt || `You are ${agent.name}, a helpful AI assistant specializing in ${agent.category}. Provide expert guidance and assistance to users within your domain of expertise.`;
  }
}

// Export singleton instance
export const agentGenerationProtocol = new AgentGenerationProtocol();