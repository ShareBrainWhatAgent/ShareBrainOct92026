import OpenAI from "openai";

export interface CodeSuggestion {
  code: string;
  explanation: string;
  confidence: number;
  type: 'completion' | 'refactor' | 'debug' | 'optimize';
}

export interface CodeAnalysis {
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  complexity: number;
  readability: number;
  security: CodeSecurityIssue[];
}

export interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

export interface CodeSecurityIssue {
  line: number;
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  fix: string;
}

export interface CodeDocumentation {
  summary: string;
  functions: FunctionDoc[];
  parameters: ParameterDoc[];
  examples: string[];
}

export interface FunctionDoc {
  name: string;
  description: string;
  parameters: ParameterDoc[];
  returns: string;
}

export interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export class CodexService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get intelligent code completion suggestions
   */
  async getCodeCompletion(
    code: string,
    cursorPosition: number,
    context: string = ""
  ): Promise<CodeSuggestion[]> {
    const prompt = `You are an AI coding assistant specialized in JavaScript and ShareBrain agent development.

Context: ${context}
Code:
${code}

Cursor position: ${cursorPosition}

Provide intelligent code completion suggestions that:
1. Are contextually relevant to ShareBrain agent development
2. Follow modern JavaScript best practices
3. Are optimized for the processMessage function pattern
4. Include proper error handling

Return suggestions in JSON format with code, explanation, confidence (0-100), and type.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a specialized coding assistant for ShareBrain AI agent development. Provide precise, contextual code suggestions in JSON format."
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

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];
    } catch (error) {
      console.error("Code completion error:", error);
      return [];
    }
  }

  /**
   * Analyze code for issues, optimization opportunities, and suggestions
   */
  async analyzeCode(code: string, systemPrompt: string = ""): Promise<CodeAnalysis> {
    const prompt = `Analyze this ShareBrain agent code for issues, optimization opportunities, and improvements.

System Prompt Context: ${systemPrompt}

Code:
${code}

Provide comprehensive analysis including:
1. Code issues (errors, warnings, improvements)
2. Optimization suggestions
3. Code complexity rating (1-10)
4. Readability rating (1-10)
5. Security issues and fixes
6. Best practices compliance

Return analysis in JSON format with detailed explanations.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a code analysis expert specializing in ShareBrain agent development. Provide detailed, actionable code analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        issues: result.issues || [],
        suggestions: result.suggestions || [],
        complexity: result.complexity || 5,
        readability: result.readability || 5,
        security: result.security || []
      };
    } catch (error) {
      console.error("Code analysis error:", error);
      return {
        issues: [],
        suggestions: [],
        complexity: 5,
        readability: 5,
        security: []
      };
    }
  }

  /**
   * Debug code and provide specific solutions
   */
  async debugCode(
    code: string,
    error: string,
    systemPrompt: string = ""
  ): Promise<CodeSuggestion[]> {
    const prompt = `Debug this ShareBrain agent code and provide specific solutions.

System Prompt Context: ${systemPrompt}

Code:
${code}

Error/Issue:
${error}

Provide debugging solutions that:
1. Identify the root cause
2. Provide specific fixes
3. Explain why the error occurred
4. Suggest preventive measures
5. Optimize the code while fixing

Return solutions in JSON format with code, explanation, confidence, and type.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a debugging expert for ShareBrain agent development. Provide precise, actionable debugging solutions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"solutions": []}');
      return result.solutions || [];
    } catch (error) {
      console.error("Debug error:", error);
      return [];
    }
  }

  /**
   * Generate comprehensive code documentation
   */
  async generateDocumentation(
    code: string,
    systemPrompt: string = ""
  ): Promise<CodeDocumentation> {
    const prompt = `Generate comprehensive documentation for this ShareBrain agent code.

System Prompt Context: ${systemPrompt}

Code:
${code}

Generate documentation including:
1. Overall summary of what the agent does
2. Function documentation with parameters and return values
3. Parameter descriptions and types
4. Usage examples
5. Integration notes for ShareBrain platform

Return documentation in JSON format with clear, professional descriptions.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a technical documentation expert for ShareBrain agents. Generate clear, comprehensive documentation."
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
        summary: result.summary || "",
        functions: result.functions || [],
        parameters: result.parameters || [],
        examples: result.examples || []
      };
    } catch (error) {
      console.error("Documentation generation error:", error);
      return {
        summary: "",
        functions: [],
        parameters: [],
        examples: []
      };
    }
  }

  /**
   * Optimize code for performance and best practices
   */
  async optimizeCode(
    code: string,
    systemPrompt: string = "",
    optimizationGoal: 'performance' | 'readability' | 'security' | 'all' = 'all'
  ): Promise<CodeSuggestion> {
    const prompt = `Optimize this ShareBrain agent code for ${optimizationGoal}.

System Prompt Context: ${systemPrompt}

Code:
${code}

Optimization Goals:
${optimizationGoal === 'all' ? 'Performance, readability, security, and best practices' : optimizationGoal}

Provide optimized code that:
1. Maintains the same functionality
2. Improves ${optimizationGoal}
3. Follows ShareBrain agent patterns
4. Includes proper error handling
5. Is production-ready

Return optimized code with detailed explanation of improvements.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a code optimization expert for ShareBrain agents. Provide production-ready optimized code."
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
        code: result.code || code,
        explanation: result.explanation || "No optimizations available",
        confidence: result.confidence || 50,
        type: 'optimize'
      };
    } catch (error) {
      console.error("Code optimization error:", error);
      return {
        code,
        explanation: "Optimization failed",
        confidence: 0,
        type: 'optimize'
      };
    }
  }

  /**
   * Generate code from natural language description
   */
  async generateCodeFromDescription(
    description: string,
    systemPrompt: string = "",
    memoryType: 'personal' | 'friends' | 'global' = 'personal'
  ): Promise<CodeSuggestion> {
    const prompt = `Generate ShareBrain agent code from this description:

Description: ${description}

System Prompt Context: ${systemPrompt}
Memory Type: ${memoryType}

Generate code that:
1. Implements a processMessage function for ShareBrain agents
2. Handles the described functionality
3. Includes proper error handling
4. Integrates with ${memoryType} memory system
5. Follows ShareBrain agent patterns
6. Is production-ready

Return generated code with explanation in JSON format.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a code generation expert for ShareBrain agents. Generate production-ready agent code from descriptions."
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
        code: result.code || "// Generated code not available",
        explanation: result.explanation || "Code generation failed",
        confidence: result.confidence || 50,
        type: 'completion'
      };
    } catch (error) {
      console.error("Code generation error:", error);
      return {
        code: "// Generated code not available",
        explanation: "Code generation failed",
        confidence: 0,
        type: 'completion'
      };
    }
  }
}