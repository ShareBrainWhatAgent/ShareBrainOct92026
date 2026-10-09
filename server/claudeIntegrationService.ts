/**
 * Agent Creation Agent Service
 * 
 * An AI assistant that helps users create, modify, and manage ShareBrain agents
 * through natural conversation - just like chatting with Claude to build agents.
 * This creates a conversational agent creation experience instead of traditional forms.
 */

import { generateAgentResponse } from "./openai";
import { storage } from "./storage";

export interface AgentCreationResponse {
  content: string;
  type: 'conversation' | 'agent_created' | 'agent_modified' | 'confirmation_needed';
  agentData?: any;
  nextSteps?: string[];
  createdAgentId?: number;
}

export class AgentCreationService {
  
  /**
   * Process user message for agent creation/modification
   * Analyzes intent and either creates agents or continues conversation
   */
  async processAgentCreationRequest(userMessage: string, context: {
    userId: string;
    conversationHistory?: Array<{role: string, content: string}>;
    sessionData?: any;
  }): Promise<AgentCreationResponse> {
    
    try {
      // Build agent creation system prompt
      const systemPrompt = this.buildAgentCreationPrompt(context);
      
      // Prepare conversation with full context
      const messages = [
        { role: "system", content: systemPrompt },
        ...(context.conversationHistory || []),
        { role: "user", content: userMessage }
      ];

      // Use AI to understand intent and generate response
      const response = await generateAgentResponse(
        systemPrompt,
        userMessage,
        context.conversationHistory || [],
        "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        0.7,
        2000
      );

      const aiResponse = response.content;
      
      // Parse AI response to extract agent creation intent
      const parsedResponse = this.parseAgentCreationIntent(aiResponse, userMessage);
      
      // If agent should be created, create it
      if (parsedResponse.shouldCreateAgent) {
        const createdAgent = await this.createAgentFromConversation(parsedResponse.agentData, context.userId);
        return {
          content: `Perfect! I've created your agent "${createdAgent.name}". 

${parsedResponse.confirmationMessage}

Your agent is now ready and has been automatically enhanced with:
- Professional website URL: /${createdAgent.websiteSlug || 'pending'}
- LLM.txt configuration for AI system discovery
- Memory system integration

You can find it in your "My Brains" section. Would you like to create another agent or modify this one?`,
          type: 'agent_created',
          createdAgentId: createdAgent.id,
          nextSteps: [
            "Create another agent",
            "Modify this agent's personality", 
            "Test the new agent",
            "Make the agent public"
          ]
        };
      }
      
      // Continue conversation for more details
      return {
        content: aiResponse,
        type: 'conversation',
        nextSteps: this.generateNextSteps(aiResponse, userMessage)
      };
      
    } catch (error) {
      console.error("Agent creation service error:", error);
      
      return {
        content: `I'd love to help you create an agent! Let's start with the basics:

What kind of agent would you like to create? For example:
- A customer service agent for your business
- A language tutor for learning Spanish
- A creative writing assistant
- A technical support helper
- A personal productivity coach

Just describe what you have in mind, and I'll help you build it step by step.`,
        type: 'conversation',
        nextSteps: [
          "I want to create a business agent",
          "Help me build a learning tutor",
          "I need a creative assistant",
          "Build me a technical helper"
        ]
      };
    }
  }

  /**
   * Build system prompt for agent creation assistant
   */
  private buildAgentCreationPrompt(context: any): string {
    return `You are the Agent Creation Assistant for ShareBrain - an AI that helps users create new agents through natural conversation. Your job is to understand what kind of agent they want and gather all the necessary information to build it.

CORE MISSION: Help users create agents conversationally, just like they would describe an idea to a human developer.

AGENT CREATION PROCESS:
1. Understand the user's vision (What should the agent do?)
2. Gather key details (Personality, expertise, use cases)
3. Determine technical specs (Model, temperature, features)
4. Create the agent when you have enough information

INFORMATION YOU NEED TO COLLECT:
- Agent name and description
- Primary purpose/role
- Personality traits and tone
- Key expertise areas
- Target users/use cases
- Whether it should be public or private
- Any special features (voice, memory, etc.)

RESPONSE GUIDELINES:
- Ask follow-up questions to clarify vague requests
- Suggest improvements based on ShareBrain best practices
- Use friendly, collaborative language
- When you have enough info, confirm details before creating
- Always mention the automatic features (URL, LLM.txt, workspace)

CREATION TRIGGERS: Create the agent when the user gives clear confirmation like:
- "Yes, create it" / "That sounds perfect"
- "Go ahead and build it"
- "Make the agent now"

EXAMPLE CONVERSATION FLOW:
User: "I want to create a customer service agent"
You: "Great! What kind of business is this for? And what tone should it have - professional, friendly, or something else?"

Current user: ${context.userId}
Conversation context: This is an ongoing agent creation session.`;
  }

  /**
   * Parse AI response to determine if agent should be created
   */
  private parseAgentCreationIntent(aiResponse: string, userMessage: string): {
    shouldCreateAgent: boolean;
    agentData?: any;
    confirmationMessage?: string;
  } {
    const userLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    
    // Check for creation triggers
    const creationTriggers = [
      'yes, create it', 'go ahead', 'build it', 'make the agent',
      'that sounds perfect', 'create the agent', 'sounds good'
    ];
    
    const shouldCreate = creationTriggers.some(trigger => 
      userLower.includes(trigger) || responseLower.includes('creating') || responseLower.includes('i\'ll create')
    );
    
    if (shouldCreate) {
      // Extract agent details from conversation context
      const agentData = this.extractAgentDataFromConversation(aiResponse, userMessage);
      return {
        shouldCreateAgent: true,
        agentData,
        confirmationMessage: `I've built your ${agentData.category?.toLowerCase() || 'assistant'} agent with the personality and features we discussed.`
      };
    }
    
    return { shouldCreateAgent: false };
  }

  /**
   * Extract agent configuration from conversation
   */
  private extractAgentDataFromConversation(aiResponse: string, userMessage: string): any {
    // Parse key information from the conversation
    const name = this.extractValue(userMessage + ' ' + aiResponse, 'name', 'agent') || 'Custom Agent';
    const description = this.extractValue(userMessage + ' ' + aiResponse, 'description', 'helps users') || 'A helpful AI assistant';
    const category = this.extractCategory(userMessage + ' ' + aiResponse);
    
    return {
      name,
      description,
      category,
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: this.generateSystemPrompt(name, description, category, userMessage),
      status: "active",
      isPrivate: false,
      voiceEnabled: true
    };
  }

  /**
   * Generate system prompt based on conversation
   */
  private generateSystemPrompt(name: string, description: string, category: string, userMessage: string): string {
    const basePrompt = `You are ${name}, ${description}.

Your primary role is to ${this.extractPrimaryRole(userMessage)}.

Key traits and behavior:
${this.extractPersonalityTraits(userMessage)}

Your expertise includes:
${this.extractExpertiseAreas(userMessage)}

Always be helpful, accurate, and maintain a ${this.extractTone(userMessage)} tone in your responses.`;

    return basePrompt;
  }

  /**
   * Create agent from extracted conversation data - Enhanced with Git Integration
   */
  private async createAgentFromConversation(agentData: any, userId: string): Promise<any> {
    try {
      // Import the enhanced agent creation service
      const { agentCreationService } = await import('./agentCreationService');
      
      // Create agent with full Git integration
      const result = await agentCreationService.createAgentWithGitIntegration({
        name: agentData.name,
        description: agentData.description,
        systemPrompt: agentData.systemPrompt,
        category: agentData.category,
        model: agentData.model || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        temperature: agentData.temperature || 0.7,
        maxTokens: agentData.maxTokens || 2048,
        isPrivate: agentData.isPrivate || false,
        voiceEnabled: agentData.voiceEnabled || false,
        imageEnabled: agentData.imageEnabled || false,
        userId: userId,
        createdBy: 'agent-creation-agent'
      }, {
        createRepository: true,
        includeInitialFiles: true,
        commitMessage: "Agent created via conversational Agent Creation Agent"
      });

      // Return agent data compatible with existing code
      return {
        id: result.agent.id,
        name: result.agent.name,
        description: result.agent.description,
        websiteSlug: result.agent.websiteSlug,
        websiteUrl: result.agent.websiteUrl,
        gitRepositoryUrl: result.agent.gitRepositoryUrl,
        development: result.development,
        nextSteps: result.nextSteps
      };
    } catch (error) {
      console.error("Error creating agent from conversation with Git integration:", error);
      
      // Fallback to basic creation if Git integration fails
      try {
        console.log("Falling back to basic agent creation...");
        const agent = await storage.createAgent({
          ...agentData,
          userId
        });

        return agent;
      } catch (fallbackError) {
        console.error("Fallback agent creation also failed:", fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Generate next steps for conversation
   */
  private generateNextSteps(response: string, userMessage: string): string[] {
    const steps = [];
    
    // If discussing agent creation
    if (response.includes('agent') || response.includes('create')) {
      steps.push("Yes, create this agent");
      steps.push("Tell me more about the features");
      steps.push("Make it a different personality");
    }
    
    // If asking for details
    if (response.includes('?') || response.includes('tell me')) {
      steps.push("It should be professional and helpful");
      steps.push("Make it friendly and casual");
      steps.push("I want it to be an expert in [topic]");
    }
    
    // Default creative suggestions
    if (steps.length === 0) {
      steps.push("Create a customer service agent");
      steps.push("Build a language tutor");
      steps.push("Make a creative writing assistant");
    }
    
    return steps.slice(0, 3);
  }

  // Helper methods for parsing conversation data
  private extractValue(text: string, key: string, defaultValue: string): string {
    const patterns = [
      new RegExp(`${key}[:\s]+(.*?)(?:[,.;]|$)`, 'i'),
      new RegExp(`(call|name).*?["']([^"']+)["']`, 'i'),
      new RegExp(`"([^"]+)".*?${key}`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return defaultValue;
  }

  private extractCategory(text: string): string {
    const categories = ['Customer Service', 'Education', 'Creative', 'Technical', 'Business', 'Entertainment'];
    const textLower = text.toLowerCase();
    
    for (const category of categories) {
      if (textLower.includes(category.toLowerCase())) {
        return category;
      }
    }
    
    // Infer from keywords
    if (textLower.includes('customer') || textLower.includes('support')) return 'Customer Service';
    if (textLower.includes('teach') || textLower.includes('tutor') || textLower.includes('learn')) return 'Education';
    if (textLower.includes('creative') || textLower.includes('writing') || textLower.includes('art')) return 'Creative';
    if (textLower.includes('technical') || textLower.includes('code') || textLower.includes('debug')) return 'Technical';
    
    return 'General';
  }

  private extractPrimaryRole(text: string): string {
    if (text.includes('help') || text.includes('assist')) return 'assist users with their needs';
    if (text.includes('teach') || text.includes('tutor')) return 'teach and educate users';
    if (text.includes('support') || text.includes('customer')) return 'provide excellent customer support';
    if (text.includes('creative') || text.includes('write')) return 'help with creative tasks and writing';
    return 'be helpful and provide valuable assistance';
  }

  private extractPersonalityTraits(text: string): string {
    const traits = [];
    if (text.includes('friendly')) traits.push('- Friendly and approachable');
    if (text.includes('professional')) traits.push('- Professional and reliable');
    if (text.includes('creative')) traits.push('- Creative and innovative');
    if (text.includes('patient')) traits.push('- Patient and understanding');
    
    return traits.length > 0 ? traits.join('\n') : '- Helpful and responsive\n- Clear and concise\n- Positive and encouraging';
  }

  private extractExpertiseAreas(text: string): string {
    const areas = [];
    if (text.includes('customer service')) areas.push('- Customer service best practices');
    if (text.includes('education') || text.includes('teaching')) areas.push('- Educational methodologies');
    if (text.includes('technical') || text.includes('code')) areas.push('- Technical problem solving');
    if (text.includes('creative') || text.includes('writing')) areas.push('- Creative writing and ideation');
    
    return areas.length > 0 ? areas.join('\n') : '- General knowledge and assistance\n- Problem-solving\n- Communication';
  }

  private extractTone(text: string): string {
    if (text.includes('professional')) return 'professional';
    if (text.includes('casual') || text.includes('friendly')) return 'friendly and casual';
    if (text.includes('formal')) return 'formal';
    return 'helpful and conversational';
  }
}

export const agentCreationService = new AgentCreationService();