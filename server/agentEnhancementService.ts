import { storage } from "./storage";
import { generateAgentResponse } from "./openai";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AgentEnhancementResult {
  success: boolean;
  message: string;
  generatedContent?: string;
  websiteContent?: string;
}

export class AgentEnhancementService {
  /**
   * Enhance an agent using its domain-specific creation manual
   */
  static async enhanceAgentWithManual(
    agentId: number, 
    manualDomain: string,
    userId: string
  ): Promise<AgentEnhancementResult> {
    try {
      // Get the agent and manual
      const agent = await storage.getAgent(agentId);
      const manual = await storage.getAgentCreationManualByDomain(manualDomain);
      
      if (!agent) {
        return { success: false, message: "Agent not found" };
      }
      
      if (!manual) {
        return { success: false, message: "Creation manual not found" };
      }

      // Verify agent belongs to user
      if (agent.userId !== userId) {
        return { success: false, message: "Unauthorized access to agent" };
      }

      // Generate comprehensive Q&A content using the manual template
      const enhancedContent = await this.generateComprehensiveQA(agent, manual);
      
      // Update agent's system prompt with enhanced content
      const updatedPrompt = await this.createEnhancedSystemPrompt(agent, manual, enhancedContent);
      
      // Update the agent
      await storage.updateAgent(agentId, {
        systemPrompt: updatedPrompt,
        description: `${agent.description} Enhanced with comprehensive ${manual.name} framework.`
      });

      // Generate website content using the enhanced information
      const websiteContent = await this.generateWebsiteContent(agent, enhancedContent);

      return {
        success: true,
        message: "Agent successfully enhanced with creation manual",
        generatedContent: enhancedContent,
        websiteContent: websiteContent
      };

    } catch (error) {
      console.error("Error enhancing agent:", error);
      return { 
        success: false, 
        message: `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Generate comprehensive Q&A content using the creation manual template
   */
  private static async generateComprehensiveQA(agent: any, manual: any): Promise<string> {
    // Using generateAgentResponse to ensure consistent model usage across the system
    const systemPrompt = `You are an expert content generator creating comprehensive Q&A databases for AI agents. 
    
    Your task is to generate detailed question-answer pairs using the provided creation manual template.
    
    CREATION MANUAL CONTEXT:
    - Domain: ${manual.domain}
    - Manual: ${manual.name}
    - Description: ${manual.description}
    - Content Structure: ${manual.contentStructure}
    - Quality Benchmarks: ${manual.qualityBenchmarks}
    
    AGENT CONTEXT:
    - Agent Name: ${agent.name}
    - Agent Description: ${agent.description}
    - Agent Category: ${agent.category}
    
    GENERATION REQUIREMENTS:
    1. Generate at least 100 comprehensive Q&A pairs
    2. Follow the content structure guidelines exactly
    3. Meet all quality benchmarks specified
    4. Cover the full scope of the domain
    5. Include specific, actionable information
    6. Format as clear question-answer pairs
    
    Generate comprehensive Q&A content now:`;

    const userMessage = `Using the creation manual template, generate comprehensive Q&A content for the ${agent.name}.
    
    Focus on these key areas:
    1. Domain Questions: ${manual.domainQuestions}
    2. Enthusiast Questions: ${manual.enthusiastQuestions}
    
    Make sure each Q&A pair provides specific, detailed information that would help users get comprehensive answers about the domain.`;

    const response = await generateAgentResponse(
      systemPrompt,
      userMessage,
      [], // No conversation history
      "Llama 3.1 70B", // Use Llama 3.1 70B for enhancement
      0.7, // Temperature
      30000 // Much higher token limit for comprehensive Q&A generation
    );

    return response.content || "";
  }

  /**
   * Create enhanced system prompt incorporating the manual content
   */
  private static async createEnhancedSystemPrompt(agent: any, manual: any, qaContent: string): Promise<string> {
    const systemPrompt = `You are creating an enhanced system prompt for an AI agent. 
    
    Combine the original agent personality with the comprehensive Q&A knowledge base.
    
    ORIGINAL AGENT:
    - Name: ${agent.name}
    - Description: ${agent.description}
    - Original Prompt: ${agent.systemPrompt}
    
    ENHANCEMENT MANUAL:
    - Domain: ${manual.domain}
    - Manual: ${manual.name}
    - Description: ${manual.description}
    
    COMPREHENSIVE Q&A KNOWLEDGE BASE:
    ${qaContent}
    
    Create an enhanced system prompt that:
    1. Preserves the original agent personality
    2. Incorporates the comprehensive knowledge base
    3. Maintains the agent's unique voice and approach
    4. Provides access to the detailed Q&A information
    5. Ensures responses are comprehensive and helpful
    
    Return only the enhanced system prompt.`;

    const userMessage = `Create an enhanced system prompt for ${agent.name} that incorporates the comprehensive Q&A knowledge base while maintaining the agent's original personality and approach.`;

    const response = await generateAgentResponse(
      systemPrompt,
      userMessage,
      [], // No conversation history
      "Llama 3.1 70B", // Use Llama 3.1 70B for enhancement
      0.3, // Lower temperature for consistent prompts
      20000 // Higher token limit for comprehensive system prompt generation
    );

    return response.content || agent.systemPrompt;
  }

  /**
   * Generate comprehensive website content using the enhanced information
   */
  private static async generateWebsiteContent(agent: any, qaContent: string): Promise<string> {
    const systemPrompt = `You are creating a comprehensive website for an AI agent. 
    
    Create a complete HTML website with embedded CSS and JavaScript that showcases the agent's knowledge.
    
    AGENT DETAILS:
    - Name: ${agent.name}
    - Description: ${agent.description}
    - Category: ${agent.category}
    
    COMPREHENSIVE Q&A KNOWLEDGE BASE:
    ${qaContent}
    
    Create a website that:
    1. Features a professional hero section
    2. Organizes knowledge into clear sections
    3. Includes interactive elements and navigation
    4. Showcases the comprehensive Q&A content
    5. Has modern, responsive design
    6. Includes Google AdWords tracking code
    
    Return only the complete HTML code with embedded CSS and JavaScript.`;

    const userMessage = `Generate a comprehensive website for ${agent.name} that showcases all the Q&A knowledge in an organized, professional format.`;

    const response = await generateAgentResponse(
      systemPrompt,
      userMessage,
      [], // No conversation history
      "Llama 3.1 70B", // Use Llama 3.1 70B for website generation
      0.3, // Lower temperature for consistent websites
      30000 // Much higher token limit for comprehensive website generation
    );

    return response.content || "";
  }
}