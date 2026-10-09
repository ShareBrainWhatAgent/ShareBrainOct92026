/**
 * Agent Creation Service - Enhanced with Git Integration
 * 
 * This service handles the conversational agent creation process and
 * integrates with the existing Git-based agent development system.
 * 
 * Integration includes:
 * - AgentGenerationProtocol for workspace creation
 * - GitService for repository creation and initial file structure
 * - Agent Builder system integration
 */

import { storage } from './storage';
import { agentGenerationProtocol } from './agentGenerationProtocol';
import { db } from './db';
import { agents, agentWorkspaces } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { Agent } from '../shared/schema';

// Import GitService conditionally - fallback if Git integration not available
let gitService: any = null;
try {
  const { GitService } = await import('./gitService');
  gitService = new GitService();
} catch (error) {
  console.warn('Git integration not available:', error);
}

interface AgentCreationRequest {
  name: string;
  description: string;
  systemPrompt: string;
  category?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  isPrivate?: boolean;
  voiceEnabled?: boolean;
  imageEnabled?: boolean;
  userId: string;
  createdBy: 'agent-creation-agent' | 'development-assistant';
}

interface GitIntegrationConfig {
  createRepository: boolean;
  developerUsername?: string;
  commitMessage?: string;
  includeInitialFiles: boolean;
}

export class AgentCreationService {
  
  /**
   * Create agent with full Git integration
   * This is the enhanced version that hooks into the existing development system
   */
  async createAgentWithGitIntegration(
    request: AgentCreationRequest,
    gitConfig: GitIntegrationConfig = { 
      createRepository: true, 
      includeInitialFiles: true,
      commitMessage: "Initial agent creation via Creation Agent"
    }
  ) {
    console.log(`🚀 Creating agent "${request.name}" with Git integration...`);
    
    try {
      // Step 1: Create the base agent using existing storage
      const agentData = {
        name: request.name,
        description: request.description,
        systemPrompt: request.systemPrompt,
        category: request.category || "General",
        model: request.model || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 2048,
        status: "active",
        isPrivate: request.isPrivate || false,
        voiceEnabled: request.voiceEnabled || false,
        imageEnabled: request.imageEnabled || false,
        userId: request.userId,
        agentType: "custom",
        isSystemAgent: false
      };

      const agent = await storage.createAgent(agentData);
      console.log(`✅ Base agent created with ID: ${agent.id}`);

      // Step 2: Execute Agent Generation Protocol (creates workspace, LLM.txt, URL)
      try {
        await agentGenerationProtocol.executeProtocol(agent);
        console.log(`🔧 Agent Generation Protocol completed for agent ${agent.id}`);
      } catch (protocolError) {
        console.warn(`⚠️ Protocol execution failed for agent ${agent.id}:`, protocolError);
        // Continue - base agent exists even if protocol fails
      }

      // Step 3: Create Git Repository (if enabled and available)
      let gitRepositoryUrl = null;
      if (gitConfig.createRepository && gitService) {
        try {
          // Check if repository already exists (in case protocol created it)
          const existingRepo = await gitService.repositoryExists(agent.id, agent.name);
          
          if (!existingRepo) {
            // Create new Git repository with initial structure
            gitRepositoryUrl = await gitService.createAgentRepository(agent.id, agent.name);
            console.log(`📁 Git repository created: ${gitRepositoryUrl}`);

            // Get the workspace created by the protocol
            const [workspace] = await db
              .select()
              .from(agentWorkspaces)
              .where(eq(agentWorkspaces.agentId, agent.id));

            // Commit initial agent structure to Git
            if (workspace && gitConfig.includeInitialFiles) {
              await gitService.commitAgentChanges(
                agent.id,
                agent.name,
                {
                  version: "1.0.0",
                  description: agent.description,
                  systemPrompt: agent.systemPrompt,
                  model: agent.model,
                  parameters: {
                    temperature: agent.temperature,
                    maxTokens: agent.maxTokens
                  },
                  code: workspace.code || "// Agent code will be added here",
                  createdBy: request.createdBy
                },
                "Creation Agent System",
                "creationagent@sharebrain.me",
                gitConfig.commitMessage || "Initial agent creation via Creation Agent"
              );
              console.log(`📝 Initial commit completed for agent ${agent.id}`);
            }

            // Update workspace with Git repository URL
            if (workspace) {
              await db.update(agentWorkspaces)
                .set({
                  githubRepoUrl: gitRepositoryUrl,
                  githubRepoName: `agent-${agent.id}-${agent.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                  gitSyncStatus: 'synced',
                  lastGitSync: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(agentWorkspaces.id, workspace.id));
              
              console.log(`🔗 Workspace linked to Git repository`);
            }
          } else {
            gitRepositoryUrl = gitService.getRepositoryUrl(agent.id, agent.name);
            console.log(`📁 Using existing Git repository: ${gitRepositoryUrl}`);
          }
        } catch (gitError) {
          console.error(`❌ Git repository creation failed for agent ${agent.id}:`, gitError);
          console.log('💡 Agent created successfully without Git integration');
          // Don't fail the entire creation - agent exists without Git
        }
      } else if (gitConfig.createRepository && !gitService) {
        console.log('💡 Git integration requested but not available - agent created without repository');
      }

      // Step 4: Return comprehensive result
      const result = {
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          category: agent.category,
          model: agent.model,
          websiteSlug: null, // Will be populated by protocol
          websiteUrl: null,
          gitRepositoryUrl: gitRepositoryUrl
        },
        development: {
          hasWorkspace: false, // Will be updated after checking
          hasGitRepo: !!gitRepositoryUrl,
          hasLLMTxtConfig: false, // Will be updated after checking
          developmentUrl: gitRepositoryUrl ? `${gitRepositoryUrl}/tree/main` : null
        },
        nextSteps: {
          editAgent: `/agents/${agent.id}/edit`,
          viewWebsite: null as string | null, // Will be populated after workspace check
          editCode: null as string | null, // Will be populated after workspace check
          viewRepository: gitRepositoryUrl
        }
      };

      // Get workspace info for complete result
      const [finalWorkspace] = await db
        .select()
        .from(agentWorkspaces)
        .where(eq(agentWorkspaces.agentId, agent.id));

      if (finalWorkspace) {
        result.agent.websiteSlug = finalWorkspace.websiteSlug;
        result.agent.websiteUrl = finalWorkspace.websiteSlug ? `https://sharebrain.me/${finalWorkspace.websiteSlug}` : null;
        result.development.hasWorkspace = true;
        result.nextSteps.viewWebsite = result.agent.websiteUrl;
        result.nextSteps.editCode = `/agent-builder?workspace=${finalWorkspace.id}`;
      }

      console.log(`🎉 Agent creation with Git integration completed for "${agent.name}"`);
      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`💥 Agent creation failed for "${request.name}":`, error);
      throw new Error(`Failed to create agent: ${errorMessage}`);
    }
  }

  /**
   * Parse natural language request into structured agent creation request
   */
  parseCreationRequest(userMessage: string, conversationHistory: any[], userId: string): AgentCreationRequest | null {
    // Simple pattern matching for now - can be enhanced with AI parsing later
    const message = userMessage.toLowerCase();
    
    // Look for creation intent
    const creationTriggers = [
      'create it', 'build it', 'make it', 'generate it',
      'create the agent', 'build the agent', 'make the agent',
      'yes, create', 'go ahead', 'sounds good',
      'let\'s do it', 'that works', 'perfect'
    ];

    const hasCreationIntent = creationTriggers.some(trigger => message.includes(trigger));
    
    if (!hasCreationIntent) {
      return null; // Not a creation request
    }

    // Extract agent details from conversation history
    let agentName = '';
    let description = '';
    let systemPrompt = '';
    let category = 'General';
    let isPrivate = false;

    // Look through conversation history for agent details
    const conversationText = conversationHistory
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    // Try to extract name (this is basic - can be enhanced)
    const namePatterns = [
      /agent called "([^"]+)"/,
      /agent named "([^"]+)"/,
      /create a ([^\s]+) agent/,
      /(\w+) assistant/,
      /(\w+) helper/
    ];

    for (const pattern of namePatterns) {
      const match = conversationText.match(pattern);
      if (match && match[1]) {
        agentName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        break;
      }
    }

    // Fallback name generation
    if (!agentName) {
      const timestamp = new Date().toISOString().slice(0, 10);
      agentName = `Custom Agent ${timestamp}`;
    }

    // Generate description and system prompt based on conversation
    description = `Custom AI agent created through natural conversation. Specializes in helping users with their specific needs.`;
    
    systemPrompt = `You are ${agentName}, a helpful AI assistant created through ShareBrain's conversational agent creation system. 

Your role is to assist users with their questions and provide helpful, accurate information. You were created based on a natural conversation about what kind of assistant would be most useful.

Always be:
- Helpful and informative
- Professional yet friendly
- Clear and concise in your responses
- Respectful and considerate

If you're unsure about something, be honest about the limitations of your knowledge and suggest where users might find more reliable information.`;

    return {
      name: agentName,
      description: description,
      systemPrompt: systemPrompt,
      category: category,
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      temperature: 0.7,
      maxTokens: 2048,
      isPrivate: isPrivate,
      voiceEnabled: false,
      imageEnabled: false,
      userId: userId,
      createdBy: 'agent-creation-agent'
    };
  }

  /**
   * Enhanced creation method that can be called from agent completion routes
   */
  async handleCreationRequest(
    userMessage: string, 
    conversationHistory: any[], 
    userId: string
  ) {
    const creationRequest = this.parseCreationRequest(userMessage, conversationHistory, userId);
    
    if (!creationRequest) {
      return null; // Not a creation request
    }

    return await this.createAgentWithGitIntegration(creationRequest, {
      createRepository: true,
      includeInitialFiles: true,
      commitMessage: "Agent created via conversational Creation Agent"
    });
  }

  /**
   * Create agent for Development Assistant (more advanced parsing)
   */
  async createAgentForDevelopmentAssistant(
    agentSpec: any,
    userId: string
  ) {
    const request: AgentCreationRequest = {
      name: agentSpec.name || 'Development Assistant Agent',
      description: agentSpec.description || 'Advanced agent created with Development Assistant guidance',
      systemPrompt: agentSpec.systemPrompt || agentSpec.prompt || 'You are a helpful AI assistant.',
      category: agentSpec.category || 'Development',
      model: agentSpec.model || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      temperature: agentSpec.temperature || 0.7,
      maxTokens: agentSpec.maxTokens || 2048,
      isPrivate: agentSpec.isPrivate || false,
      voiceEnabled: agentSpec.voiceEnabled || false,
      imageEnabled: agentSpec.imageEnabled || false,
      userId: userId,
      createdBy: 'development-assistant'
    };

    return await this.createAgentWithGitIntegration(request, {
      createRepository: true,
      includeInitialFiles: true,
      commitMessage: "Agent created via Development Assistant"
    });
  }
}

export const agentCreationService = new AgentCreationService();