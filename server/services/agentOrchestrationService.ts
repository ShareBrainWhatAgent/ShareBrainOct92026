import { storage } from "../storage";
import { Agent, AgentCapability, AgentRanking, UserAgentPreference, IntentDetectionLog } from "../../shared/schema";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OrchestrationResult {
  primary: {
    agent: Agent;
    response: string;
    reasoning: string;
  };
  alternatives?: Array<{
    agent: Agent;
    response: string;
    reasoning: string;
  }>;
  showAlternatives?: boolean;
  allowSelection?: boolean;
}

interface IntentDetection {
  intent: string;
  category: string;
  confidence: number;
  keywords: string[];
}

class AgentOrchestrationService {
  /**
   * Main orchestration method - determines which agent(s) to use for a query
   */
  async orchestrateAgentResponse(
    userId: string,
    query: string,
    conversationId?: number,
    initiatingAgentId?: number
  ): Promise<OrchestrationResult> {
    try {
      // Step 1: Detect intent and category
      const intentDetection = await this.detectIntent(query);
      
      // Log intent detection
      await storage.createIntentDetectionLog({
        userId,
        queryText: query,
        detectedIntent: intentDetection.intent,
        detectedCategory: intentDetection.category,
        confidence: intentDetection.confidence,
      });

      // Step 2: Check user preferences first
      const userPreference = await this.getUserPreferredAgent(userId, intentDetection.category);
      
      if (userPreference && userPreference.confidence > 0.6) {
        // User has strong preference - use their preferred agent
        const primaryAgent = await storage.getAgent(userPreference.preferredAgentId);
        if (primaryAgent && primaryAgent.status === 'active') {
          const response = await this.callAgent(primaryAgent.id, query, conversationId);
          
          // Get alternatives for comparison
          const alternatives = await this.getAlternativeAgents(
            intentDetection.category, 
            userPreference.preferredAgentId, 
            2
          );
          
          return {
            primary: {
              agent: primaryAgent,
              response,
              reasoning: `Using your preferred ${intentDetection.category} expert`
            },
            alternatives: await Promise.all(
              alternatives.map(async (agent) => ({
                agent,
                response: await this.callAgent(agent.id, query, conversationId),
                reasoning: `Alternative ${intentDetection.category} expert`
              }))
            ),
            showAlternatives: false // Hidden by default, user can request
          };
        }
      }

      // Step 3: No strong preference - use ranking system
      const topAgents = await this.getTopRankedAgents(intentDetection.category, 3);
      
      if (topAgents.length === 0) {
        throw new Error(`No agents found for category: ${intentDetection.category}`);
      }

      if (topAgents.length === 1) {
        // Only one agent available
        const agent = topAgents[0];
        const response = await this.callAgent(agent.id, query, conversationId);
        
        return {
          primary: {
            agent,
            response,
            reasoning: `Top-ranked ${intentDetection.category} expert`
          }
        };
      }

      // Multiple agents available - get responses from top agents
      const responses = await Promise.all(
        topAgents.map(async (agent) => ({
          agent,
          response: await this.callAgent(agent.id, query, conversationId),
          reasoning: `Ranked #${topAgents.indexOf(agent) + 1} ${intentDetection.category} expert`
        }))
      );

      return {
        primary: responses[0], // Highest ranked
        alternatives: responses.slice(1),
        allowSelection: true, // Allow user to choose preferred
        showAlternatives: true
      };

    } catch (error) {
      console.error("Agent orchestration error:", error);
      throw error;
    }
  }

  /**
   * Detect user intent using AI
   */
  private async detectIntent(query: string): Promise<IntentDetection> {
    try {
      const prompt = `Analyze this user query and detect the intent and category for agent routing:

Query: "${query}"

Respond with JSON only:
{
  "intent": "specific_intent", 
  "category": "agent_category",
  "confidence": 0.0-1.0,
  "keywords": ["key", "words"]
}

Common categories:
- language_[language] (e.g., language_catalan, language_spanish)
- cooking_[cuisine] (e.g., cooking_italian, cooking_asian)
- travel_[region] (e.g., travel_europe, travel_asia)
- business_[type] (e.g., business_marketing, business_finance)
- health_[specialty] (e.g., health_nutrition, health_fitness)
- tech_[domain] (e.g., tech_programming, tech_design)
- creative_[type] (e.g., creative_writing, creative_art)
- academic_[subject] (e.g., academic_math, academic_science)

Examples:
"How do I say hello in Catalan?" → {"intent": "language_translation", "category": "language_catalan", "confidence": 0.95, "keywords": ["say", "hello", "catalan"]}
"Best Italian pasta recipe?" → {"intent": "recipe_request", "category": "cooking_italian", "confidence": 0.9, "keywords": ["italian", "pasta", "recipe"]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No intent detection response");

      const result = JSON.parse(content);
      return {
        intent: result.intent || "general_query",
        category: result.category || "general",
        confidence: result.confidence || 0.5,
        keywords: result.keywords || []
      };
    } catch (error) {
      console.error("Intent detection error:", error);
      // Fallback to simple keyword matching
      return this.fallbackIntentDetection(query);
    }
  }

  /**
   * Fallback intent detection using keyword matching
   */
  private fallbackIntentDetection(query: string): IntentDetection {
    const lowerQuery = query.toLowerCase();
    
    // Language detection patterns
    const languages = ['catalan', 'spanish', 'french', 'italian', 'german', 'portuguese', 'mandarin', 'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'russian', 'english'];
    for (const lang of languages) {
      if (lowerQuery.includes(lang) || lowerQuery.includes(`in ${lang}`) || lowerQuery.includes(`${lang} language`)) {
        return {
          intent: "language_translation",
          category: `language_${lang}`,
          confidence: 0.8,
          keywords: [lang, "language", "translation"]
        };
      }
    }

    // Cooking detection
    if (lowerQuery.includes('recipe') || lowerQuery.includes('cook') || lowerQuery.includes('dish') || lowerQuery.includes('food')) {
      return {
        intent: "recipe_request",
        category: "cooking_general",
        confidence: 0.7,
        keywords: ["recipe", "cooking", "food"]
      };
    }

    return {
      intent: "general_query",
      category: "general",
      confidence: 0.3,
      keywords: []
    };
  }

  /**
   * Get user's preferred agent for a category
   */
  private async getUserPreferredAgent(userId: string, category: string): Promise<UserAgentPreference | null> {
    try {
      return await storage.getUserAgentPreference(userId, category);
    } catch (error) {
      console.error("Error getting user preference:", error);
      return null;
    }
  }

  /**
   * Get top-ranked agents for a category
   */
  private async getTopRankedAgents(category: string, limit: number = 3): Promise<Agent[]> {
    try {
      return await storage.getTopRankedAgentsByCategory(category, limit);
    } catch (error) {
      console.error("Error getting top ranked agents:", error);
      return [];
    }
  }

  /**
   * Get alternative agents excluding the primary choice
   */
  private async getAlternativeAgents(category: string, excludeAgentId: number, limit: number = 2): Promise<Agent[]> {
    try {
      const allTopAgents = await storage.getTopRankedAgentsByCategory(category, limit + 3);
      return allTopAgents.filter(agent => agent.id !== excludeAgentId).slice(0, limit);
    } catch (error) {
      console.error("Error getting alternative agents:", error);
      return [];
    }
  }

  /**
   * Call an agent and get response
   */
  private async callAgent(agentId: number, query: string, conversationId?: number): Promise<string> {
    try {
      const agent = await storage.getAgent(agentId);
      if (!agent) throw new Error(`Agent ${agentId} not found`);

      // Build conversation context if available
      let messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
      if (conversationId) {
        const conversationMessages = await storage.getMessagesByConversation(conversationId);
        messages = conversationMessages.slice(-10).map(msg => ({
          role: msg.role === "user" ? "user" as const : "assistant" as const,
          content: msg.content
        }));
      }

      // Add system prompt and user query
      const systemMessage = { role: "system" as const, content: agent.systemPrompt || "You are a helpful AI assistant." };
      const userMessage = { role: "user" as const, content: query };

      const response = await openai.chat.completions.create({
        model: agent.model || "gpt-4o",
        messages: [systemMessage, ...messages, userMessage],
        temperature: agent.temperature || 0.7,
        max_tokens: agent.maxTokens || 2048,
      });

      return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error(`Error calling agent ${agentId}:`, error);
      return "I'm sorry, but I'm having trouble responding right now. Please try again.";
    }
  }

  /**
   * Record user's agent selection for learning preferences
   */
  async recordAgentSelection(userId: string, category: string, selectedAgentId: number): Promise<void> {
    try {
      await storage.recordUserAgentPreference(userId, category, selectedAgentId);
      
      // Update agent rankings based on selection
      await storage.updateAgentRanking(selectedAgentId, category, {
        userPreferenceScore: 0.1, // Small boost
        totalUses: 1
      });
    } catch (error) {
      console.error("Error recording agent selection:", error);
    }
  }

  /**
   * Record interaction for analytics and ranking improvement
   */
  async recordAgentInteraction(
    userId: string,
    targetAgentId: number,
    query: string,
    responseQuality?: number,
    continuedConversation?: boolean,
    responseTime?: number,
    conversationId?: number,
    initiatingAgentId?: number
  ): Promise<void> {
    try {
      await storage.createAgentInteraction({
        initiatingAgentId,
        targetAgentId,
        userId,
        conversationId,
        queryText: query,
        responseQuality,
        continuedConversation: continuedConversation || false,
        responseTime
      });
    } catch (error) {
      console.error("Error recording agent interaction:", error);
    }
  }
}

export { AgentOrchestrationService };
export const agentOrchestrationService = new AgentOrchestrationService();