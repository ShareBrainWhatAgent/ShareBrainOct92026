import OpenAI from "openai";
import { CodexService } from "./codexService";
import { storage } from "../storage";

export interface CodeCompletion {
  id: string;
  code: string;
  description: string;
  confidence: number;
  insertText: string;
  cursorOffset: number;
}

export interface SmartSuggestion {
  type: 'improvement' | 'pattern' | 'performance' | 'security';
  title: string;
  description: string;
  code: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

export interface DeveloperInsight {
  codeQuality: number;
  bestPractices: string[];
  commonPatterns: string[];
  recommendations: SmartSuggestion[];
  learningResources: string[];
}

export interface CollaborationFeature {
  type: 'comment' | 'suggestion' | 'review';
  content: string;
  author: string;
  timestamp: Date;
  resolved: boolean;
}

export class DeveloperExperienceService {
  private openai: OpenAI;
  private codexService: CodexService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.codexService = new CodexService();
  }

  /**
   * Provide intelligent code completion with context awareness
   */
  async getIntelligentCompletion(
    code: string,
    cursorPosition: number,
    context: {
      systemPrompt?: string;
      recentChanges?: string[];
      memoryType?: string;
      projectContext?: string;
    }
  ): Promise<CodeCompletion[]> {
    const prompt = `You are an intelligent code completion assistant for ShareBrain agent development.

Current code context:
${code}

Cursor position: ${cursorPosition}
System prompt context: ${context.systemPrompt || ''}
Memory type: ${context.memoryType || 'personal'}
Recent changes: ${context.recentChanges?.join(', ') || 'none'}

Provide intelligent code completions that:
1. Are contextually relevant to the current code
2. Follow ShareBrain agent development patterns
3. Consider the memory type and system prompt
4. Are production-ready and well-documented
5. Include proper error handling

Return up to 5 completions in JSON format with id, code, description, confidence, insertText, and cursorOffset.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an intelligent code completion expert for ShareBrain agents. Provide precise, contextual code completions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"completions": []}');
      return result.completions || [];
    } catch (error) {
      console.error("Intelligent completion error:", error);
      return [];
    }
  }

  /**
   * Generate smart suggestions for code improvements
   */
  async getSmartSuggestions(
    code: string,
    systemPrompt: string = "",
    userHistory: string[] = []
  ): Promise<SmartSuggestion[]> {
    const prompt = `Analyze this ShareBrain agent code and provide smart improvement suggestions.

Code:
${code}

System Prompt: ${systemPrompt}
User History: ${userHistory.join(', ')}

Provide smart suggestions for:
1. Code improvements and optimizations
2. Best practice implementations
3. Performance enhancements
4. Security improvements
5. ShareBrain-specific patterns

Return suggestions in JSON format with type, title, description, code, priority, and impact.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a code improvement expert for ShareBrain agents. Provide actionable, prioritized suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error("Smart suggestions error:", error);
      return [];
    }
  }

  /**
   * Provide comprehensive developer insights
   */
  async getDeveloperInsights(
    code: string,
    systemPrompt: string = "",
    workspaceHistory: any[] = []
  ): Promise<DeveloperInsight> {
    const prompt = `Provide comprehensive developer insights for this ShareBrain agent code.

Code:
${code}

System Prompt: ${systemPrompt}
Workspace History: ${JSON.stringify(workspaceHistory.slice(-5))}

Analyze and provide:
1. Overall code quality score (1-100)
2. Best practices being followed
3. Common patterns identified
4. Prioritized recommendations
5. Learning resources and documentation

Return insights in JSON format with detailed explanations.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a developer insights expert for ShareBrain agents. Provide comprehensive, actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        codeQuality: result.codeQuality || 50,
        bestPractices: result.bestPractices || [],
        commonPatterns: result.commonPatterns || [],
        recommendations: result.recommendations || [],
        learningResources: result.learningResources || []
      };
    } catch (error) {
      console.error("Developer insights error:", error);
      return {
        codeQuality: 50,
        bestPractices: [],
        commonPatterns: [],
        recommendations: [],
        learningResources: []
      };
    }
  }

  /**
   * Enhanced debugging workflow with step-by-step guidance
   */
  async getEnhancedDebuggingWorkflow(
    code: string,
    error: string,
    systemPrompt: string = "",
    debugHistory: string[] = []
  ): Promise<{
    steps: Array<{
      step: number;
      title: string;
      description: string;
      code?: string;
      verification: string;
    }>;
    rootCause: string;
    prevention: string[];
    testingStrategy: string;
  }> {
    const prompt = `Provide an enhanced debugging workflow for this ShareBrain agent code.

Code:
${code}

Error: ${error}
System Prompt: ${systemPrompt}
Debug History: ${debugHistory.join(', ')}

Provide a comprehensive debugging workflow with:
1. Step-by-step debugging process
2. Root cause analysis
3. Prevention strategies
4. Testing recommendations

Return in JSON format with detailed steps and explanations.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a debugging workflow expert for ShareBrain agents. Provide systematic, step-by-step debugging guidance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        steps: result.steps || [],
        rootCause: result.rootCause || "Unknown",
        prevention: result.prevention || [],
        testingStrategy: result.testingStrategy || "No testing strategy provided"
      };
    } catch (error) {
      console.error("Enhanced debugging workflow error:", error);
      return {
        steps: [],
        rootCause: "Unknown",
        prevention: [],
        testingStrategy: "No testing strategy provided"
      };
    }
  }

  /**
   * Generate code templates and patterns
   */
  async generateCodeTemplate(
    templateType: 'memory-agent' | 'api-integration' | 'data-processing' | 'custom',
    requirements: string,
    memoryType: 'personal' | 'friends' | 'global' = 'personal'
  ): Promise<{
    code: string;
    description: string;
    usage: string;
    examples: string[];
    bestPractices: string[];
  }> {
    const prompt = `Generate a ShareBrain agent code template for ${templateType}.

Requirements: ${requirements}
Memory Type: ${memoryType}

Generate a complete, production-ready template with:
1. Full implementation code
2. Clear description of functionality
3. Usage instructions
4. Multiple examples
5. Best practices

Return in JSON format with all components.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a code template expert for ShareBrain agents. Generate production-ready, well-documented templates."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        code: result.code || "// Template generation failed",
        description: result.description || "No description available",
        usage: result.usage || "No usage information available",
        examples: result.examples || [],
        bestPractices: result.bestPractices || []
      };
    } catch (error) {
      console.error("Code template generation error:", error);
      return {
        code: "// Template generation failed",
        description: "No description available",
        usage: "No usage information available",
        examples: [],
        bestPractices: []
      };
    }
  }

  /**
   * Provide learning path recommendations
   */
  async getLearningPath(
    currentSkillLevel: 'beginner' | 'intermediate' | 'advanced',
    interests: string[],
    completedProjects: string[] = []
  ): Promise<{
    path: Array<{
      module: string;
      title: string;
      description: string;
      duration: string;
      resources: string[];
      projects: string[];
    }>;
    nextSteps: string[];
    skillGaps: string[];
  }> {
    const prompt = `Create a personalized learning path for ShareBrain agent development.

Current Skill Level: ${currentSkillLevel}
Interests: ${interests.join(', ')}
Completed Projects: ${completedProjects.join(', ')}

Create a comprehensive learning path with:
1. Structured learning modules
2. Progressive skill building
3. Hands-on projects
4. Resource recommendations
5. Next steps and skill gaps

Return in JSON format with detailed learning pathway.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a learning path expert for ShareBrain agent development. Create personalized, progressive learning experiences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        path: result.path || [],
        nextSteps: result.nextSteps || [],
        skillGaps: result.skillGaps || []
      };
    } catch (error) {
      console.error("Learning path generation error:", error);
      return {
        path: [],
        nextSteps: [],
        skillGaps: []
      };
    }
  }
}