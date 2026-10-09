/**
 * Claude Direct Service - Direct integration with Anthropic's Claude API
 * Provides Development Assistant functionality within ShareBrain platform
 */

import Anthropic from '@anthropic-ai/sdk';

// Latest Claude model as per blueprint guidelines
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

interface ClaudeDirectResponse {
  content: string;
  type: 'development_assistance' | 'general_help' | 'agent_creation_guidance';
  metadata?: {
    model: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

interface ConversationContext {
  userId: string;
  conversationHistory: Array<{ role: string; content: string }>;
  sessionData: Record<string, any>;
}

class ClaudeDirectService {
  private anthropic: Anthropic;

  constructor() {
    // Make Claude API optional - fallback to local systems if not available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      console.warn('ANTHROPIC_API_KEY not found - Claude features will be limited');
      this.anthropic = null as any; // Will trigger fallback behavior
    }
  }

  async processDevelopmentQuery(
    userMessage: string, 
    context: ConversationContext
  ): Promise<ClaudeDirectResponse> {
    // Check if Claude API is available
    if (!this.anthropic || !process.env.ANTHROPIC_API_KEY) {
      return this.getFallbackResponse(userMessage, context);
    }

    try {
      // Build conversation history for Claude
      const messages = this.buildClaudeMessages(userMessage, context);
      
      const response = await this.anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 2048,
        temperature: 0.7,
        system: this.getDevelopmentAssistantSystemPrompt(),
        messages: messages
      });

      const content = response.content[0]?.text || '';
      
      // Determine response type based on content analysis
      const responseType = this.analyzeResponseType(userMessage, content);

      return {
        content,
        type: responseType,
        metadata: {
          model: DEFAULT_MODEL_STR,
          usage: response.usage ? {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens
          } : undefined
        }
      };

    } catch (error) {
      console.error('Claude Direct Service error:', error);
      
      // Fallback response
      return {
        content: "I'm having trouble connecting to the development assistant right now. Please try again in a moment, or let me know if you need help with something specific about ShareBrain.",
        type: 'general_help'
      };
    }
  }

  private buildClaudeMessages(
    userMessage: string, 
    context: ConversationContext
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    // Add conversation history (last 10 messages for context)
    const recentHistory = context.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
  }

  private getDevelopmentAssistantSystemPrompt(): string {
    return `You are the ShareBrain Development Assistant, powered by Claude. You help users with:

1. **ShareBrain Platform Questions**: Architecture, features, agent creation, memory systems, etc.
2. **AI Agent Development**: Best practices, system prompts, agent configuration
3. **Technical Guidance**: Integration help, API usage, troubleshooting
4. **Agent Creation Assistance**: Help users design and create effective AI agents

## ShareBrain Platform Context:
- Full-stack AI agent platform with React frontend, Express backend, PostgreSQL database
- Uses Llama 3.1 70B as primary AI model through Together AI
- Features: Personal agents, global brains, memory systems, voice chat, agent workspaces
- Recent features: Agent Creation Agent, audio caching, interactive lessons
- Support for 180+ pre-built agents including language tutors

## Your Role:
- Provide detailed, actionable guidance
- Help users understand ShareBrain's capabilities and architecture
- Assist with agent creation and optimization
- Answer technical questions about the platform
- Offer development best practices and suggestions

## Response Style:
- Be helpful, technical when needed, but accessible
- Provide specific examples and code snippets when relevant
- Reference ShareBrain features and capabilities
- Suggest practical next steps

Always identify yourself as the ShareBrain Development Assistant and focus on helping users succeed with the platform.`;
  }

  private analyzeResponseType(userMessage: string, response: string): ClaudeDirectResponse['type'] {
    const message = userMessage.toLowerCase();
    
    if (message.includes('create') && (message.includes('agent') || message.includes('brain'))) {
      return 'agent_creation_guidance';
    }
    
    if (message.includes('sharebrain') || message.includes('platform') || 
        message.includes('api') || message.includes('technical')) {
      return 'development_assistance';
    }
    
    return 'general_help';
  }

  // Test method to verify Claude API connectivity
  async testConnection(): Promise<boolean> {
    // Return false if no API key is configured
    if (!this.anthropic || !process.env.ANTHROPIC_API_KEY) {
      return false;
    }

    try {
      const response = await this.anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Hello, please respond with "Claude API connection successful"'
        }]
      });
      
      const content = response.content[0]?.text || '';
      return content.includes('successful');
    } catch (error) {
      console.error('Claude API test failed:', error);
      return false;
    }
  }

  /**
   * Fallback response when Claude API is not available
   */
  private getFallbackResponse(userMessage: string, context: ConversationContext): ClaudeDirectResponse {
    return {
      content: `I'm currently operating in basic mode as the Claude API is not configured. 

I can still help you with ShareBrain development questions! Here are some things I can assist with:

• **Agent Creation**: Help design system prompts and agent configurations
• **ShareBrain Features**: Explain platform capabilities and best practices  
• **Development Guidance**: Share insights about AI agent development
• **Technical Questions**: Answer questions about the ShareBrain architecture

What would you like help with today?

*Note: For enhanced conversational agent creation, configure the Claude API key to unlock the full Development Assistant experience.*`,
      type: 'general_help',
      metadata: {
        model: 'fallback-mode',
        usage: undefined
      }
    };
  }
}

export const claudeDirectService = new ClaudeDirectService();