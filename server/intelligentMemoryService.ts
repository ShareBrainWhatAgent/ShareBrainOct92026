import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertPersonalMemory, PersonalMemory } from "@shared/schema";

if (!process.env.TOGETHER_API_KEY) {
  throw new Error("Together API key is required for intelligent memory service");
}

// Use Together AI client for Llama 3.1 70B
const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

export interface MemoryCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export interface MemoryClassification {
  category: string;
  key: string;
  value: string;
  confidence: number;
  shouldConfirm: boolean;
  confirmationMessage: string;
}

export interface MemoryRequest {
  isMemoryRequest: boolean;
  classification?: MemoryClassification;
  originalStatement: string;
}

export class IntelligentMemoryService {
  private readonly memoryCategories: MemoryCategory[] = [
    {
      id: "favorite_restaurants",
      name: "Favorite Restaurants",
      description: "Preferred restaurants, cafes, and food places",
      examples: ["My favorite Pho restaurant is Pho 95", "I love the pizza at Tony's"]
    },
    {
      id: "restaurant_recommendation",
      name: "Restaurant Recommendations",
      description: "Specific restaurant recommendations with details about location, cuisine, and experience",
      examples: ["I recommend Tony's Pizza on 5th Street - amazing thin crust", "The Golden Dragon in Chinatown has the best dim sum"]
    },
    {
      id: "cuisine_preference",
      name: "Cuisine Preferences",
      description: "Preferred types of cuisine and food styles",
      examples: ["I love authentic Thai food", "Mexican street tacos are my favorite"]
    },
    {
      id: "location_dining",
      name: "Location-Based Dining",
      description: "Restaurant experiences and recommendations tied to specific locations",
      examples: ["Great seafood restaurants in Boston", "Best coffee shops in downtown Seattle"]
    },
    {
      id: "dietary_preferences",
      name: "Dietary Preferences",
      description: "Food preferences, allergies, and dietary restrictions",
      examples: ["I'm vegetarian", "I'm allergic to peanuts", "I love spicy food"]
    },
    {
      id: "location_preferences",
      name: "Location Information",
      description: "Where user lives, works, or frequently visits",
      examples: ["I live in Denver", "I work in downtown", "I grew up in Texas"]
    },
    {
      id: "personal_preferences",
      name: "Personal Preferences",
      description: "General likes, dislikes, and preferences",
      examples: ["I prefer morning meetings", "I don't like crowds", "I love hiking"]
    },
    {
      id: "travel_experiences",
      name: "Travel & Experiences",
      description: "Places visited, travel plans, and memorable experiences",
      examples: ["I went to Paris last year", "I want to visit Japan", "I love mountain climbing"]
    },
    {
      id: "work_information",
      name: "Work & Career",
      description: "Job, career, work preferences, and professional information",
      examples: ["I work at Google", "I'm a software engineer", "I prefer remote work"]
    },
    {
      id: "family_information",
      name: "Family & Relationships",
      description: "Family members, relationships, and personal connections",
      examples: ["I have two kids", "My wife is a doctor", "I'm married"]
    },
    {
      id: "important_dates",
      name: "Important Dates",
      description: "Birthdays, anniversaries, and significant dates",
      examples: ["My birthday is March 15", "Our anniversary is in June"]
    },
    {
      id: "hobbies_interests",
      name: "Hobbies & Interests",
      description: "Activities, hobbies, and interests",
      examples: ["I play guitar", "I collect stamps", "I love reading sci-fi"]
    },
    {
      id: "health_information",
      name: "Health & Wellness",
      description: "Health conditions, medications, and wellness preferences",
      examples: ["I take medication for diabetes", "I go to the gym daily"]
    }
  ];

  /**
   * Analyze a user message to determine if it contains memory information
   */
  async analyzeForMemory(message: string): Promise<MemoryRequest> {
    try {
      const prompt = `You are an AI assistant that analyzes user messages to detect personal information that should be remembered.

User Message: "${message}"

Available Memory Categories:
${this.memoryCategories.map(cat => `- ${cat.id}: ${cat.description} (Examples: ${cat.examples.join(', ')})`).join('\n')}

IMPORTANT: You must respond with ONLY valid JSON, no other text. Use this exact format:

{
  "isMemoryRequest": true,
  "category": "category_id",
  "key": "specific_key",
  "value": "extracted_value",
  "confidence": 0.85,
  "shouldConfirm": false,
  "confirmationMessage": "I'll remember that extracted_value. Is this correct?"
}

OR if no memory information is found:

{
  "isMemoryRequest": false,
  "category": null,
  "key": null,
  "value": null,
  "confidence": 0.0,
  "shouldConfirm": false,
  "confirmationMessage": null
}

Guidelines:
- Only extract clear, specific personal information
- Use confidence < 0.7 for ambiguous statements
- Require confirmation for sensitive information
- Return isMemoryRequest: false for general conversation
- Use descriptive keys like "favorite_pho_restaurant", "dietary_restriction_nuts"
- Respond with ONLY the JSON object, no additional text`;

      console.log(`[LLAMA DEBUG] Sending request to Llama 3.1 70B with prompt length: ${prompt.length}`);
      
      const response = await together.chat.completions.create({
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      });

      const responseContent = response.choices[0].message.content || "{}";
      console.log(`[LLAMA DEBUG] Raw Llama response:`, responseContent);
      
      const result = this.parseJsonResponse(responseContent);
      console.log(`[LLAMA DEBUG] Parsed JSON result:`, result);
      
      if (!result.isMemoryRequest) {
        return { isMemoryRequest: false, originalStatement: message };
      }

      return {
        isMemoryRequest: true,
        classification: {
          category: result.category,
          key: result.key,
          value: result.value,
          confidence: result.confidence || 0.5,
          shouldConfirm: result.shouldConfirm || false,
          confirmationMessage: result.confirmationMessage || `I'll remember that ${result.value}. Is this correct?`
        },
        originalStatement: message
      };
    } catch (error) {
      console.error("Error analyzing memory request:", error);
      return { isMemoryRequest: false, originalStatement: message };
    }
  }

  /**
   * Parse JSON response from Llama with fallback handling
   */
  private parseJsonResponse(responseContent: string): any {
    console.log(`[JSON PARSE DEBUG] Attempting to parse response of length: ${responseContent.length}`);
    
    try {
      // Try direct JSON parsing first
      console.log(`[JSON PARSE DEBUG] Trying direct JSON.parse...`);
      const result = JSON.parse(responseContent);
      console.log(`[JSON PARSE DEBUG] ✅ Direct JSON parsing successful:`, result);
      return result;
    } catch (error) {
      console.log(`[JSON PARSE DEBUG] Direct parsing failed, trying to extract JSON...`);
      
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log(`[JSON PARSE DEBUG] Found JSON match, attempting to parse:`, jsonMatch[0]);
          const result = JSON.parse(jsonMatch[0]);
          console.log(`[JSON PARSE DEBUG] ✅ Extracted JSON parsing successful:`, result);
          return result;
        } else {
          console.log(`[JSON PARSE DEBUG] No JSON pattern found in response`);
        }
      } catch (secondError) {
        console.warn(`[JSON PARSE DEBUG] Failed to parse extracted JSON:`, secondError);
      }
      
      console.warn(`[JSON PARSE DEBUG] ❌ All parsing attempts failed. Response content:`, responseContent);
      
      // Return safe fallback
      const fallback = {
        isMemoryRequest: false,
        category: null,
        key: null,
        value: null,
        confidence: 0.0,
        shouldConfirm: false,
        confirmationMessage: null
      };
      console.log(`[JSON PARSE DEBUG] Returning fallback result:`, fallback);
      return fallback;
    }
  }

  /**
   * Store a memory in the database
   */
  async storeMemory(
    userId: string,
    agentId: number,
    classification: MemoryClassification,
    originalStatement: string
  ): Promise<PersonalMemory> {
    console.log(`[MEMORY STORE DEBUG] Starting memory storage process`);
    
    // Check if this is a global brain with shared memory
    const agent = await storage.getAgent(agentId);
    if (agent?.hasSharedMemory) {
      console.log(`[MEMORY STORE DEBUG] Agent ${agentId} is a global brain - storing as shared memory`);
      return this.storeSharedMemory(agentId, classification, originalStatement, userId);
    }
    
    const memoryKey = `${classification.category}.${classification.key}`;
    console.log(`[MEMORY STORE DEBUG] Generated memory key: ${memoryKey}`);
    
    try {
      // Check if memory already exists
      console.log(`[MEMORY STORE DEBUG] Checking for existing memory with key: ${memoryKey}`);
      const existing = await storage.findPersonalMemoryByKey(userId, agentId, memoryKey);
      console.log(`[MEMORY STORE DEBUG] Existing memory found:`, existing ? 'YES' : 'NO');
      
      if (existing) {
        // Update existing memory
        console.log(`[MEMORY STORE DEBUG] Updating existing memory ID: ${existing.id}`);
        const result = await storage.updatePersonalMemory(
          existing.id,
          classification.value,
          originalStatement
        ) as PersonalMemory;
        console.log(`[MEMORY STORE DEBUG] ✅ Memory updated successfully:`, result);
        return result;
      } else {
        // Create new memory
        console.log(`[MEMORY STORE DEBUG] Creating new memory with data:`, {
          userId,
          agentId,
          memoryKey,
          memoryValue: classification.value,
          originalStatement
        });
        
        const result = await storage.createPersonalMemory({
          userId,
          agentId,
          memoryKey,
          memoryValue: classification.value,
          originalStatement
        });
        console.log(`[MEMORY STORE DEBUG] ✅ Memory created successfully:`, result);
        return result;
      }
    } catch (error: any) {
      console.error(`[MEMORY STORE DEBUG] ❌ Memory storage failed:`, {
        error: error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStack: error?.stack,
        userId,
        agentId,
        memoryKey,
        classification
      });
      throw error; // Re-throw to be caught by the calling function
    }
  }

  /**
   * Get all memories for a user and agent, organized by category
   */
  async getOrganizedMemories(userId: string, agentId: number): Promise<Record<string, PersonalMemory[]>> {
    const memories = await storage.getPersonalMemories(userId, agentId);
    const organized: Record<string, PersonalMemory[]> = {};
    
    for (const memory of memories) {
      const category = memory.memoryKey.split('.')[0];
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(memory);
    }
    
    return organized;
  }

  /**
   * Store a shared memory for global brains
   */
  async storeSharedMemory(
    agentId: number,
    classification: MemoryClassification,
    originalStatement: string,
    contributorId: string
  ): Promise<PersonalMemory> {
    console.log(`[SHARED MEMORY DEBUG] Storing shared memory for agent ${agentId}`);
    
    const memoryKey = `${classification.category}.${classification.key}`;
    console.log(`[SHARED MEMORY DEBUG] Generated memory key: ${memoryKey}`);
    
    try {
      // Check if similar shared memory already exists
      const existing = await storage.findSharedMemoryByKey(agentId, memoryKey);
      console.log(`[SHARED MEMORY DEBUG] Existing shared memory found:`, existing ? 'YES' : 'NO');
      
      if (existing) {
        // Update existing shared memory with new information
        console.log(`[SHARED MEMORY DEBUG] Updating existing shared memory ID: ${existing.id}`);
        const result = await storage.updateSharedMemory(
          existing.id,
          classification.value,
          originalStatement,
          contributorId
        );
        console.log(`[SHARED MEMORY DEBUG] ✅ Shared memory updated successfully`);
        return result as PersonalMemory; // Cast for compatibility
      } else {
        // Create new shared memory
        console.log(`[SHARED MEMORY DEBUG] Creating new shared memory`);
        const result = await storage.createSharedMemory({
          agentId,
          memoryKey,
          memoryValue: classification.value,
          originalStatement,
          contributorId,
          upvotes: 1, // Start with 1 upvote from contributor
          downvotes: 0
        });
        console.log(`[SHARED MEMORY DEBUG] ✅ Shared memory created successfully`);
        return result as PersonalMemory; // Cast for compatibility
      }
    } catch (error: any) {
      console.error(`[SHARED MEMORY DEBUG] ❌ Shared memory storage failed:`, error);
      throw error;
    }
  }

  /**
   * Get shared memories for a global brain agent
   */
  async getSharedMemories(agentId: number, limit: number = 50): Promise<any[]> {
    try {
      const memories = await storage.getSharedMemories(agentId, limit);
      console.log(`[SHARED MEMORY DEBUG] Retrieved ${memories.length} shared memories for agent ${agentId}`);
      return memories;
    } catch (error) {
      console.error(`[SHARED MEMORY DEBUG] Error retrieving shared memories:`, error);
      return [];
    }
  }

  /**
   * Format shared memories for AI context injection
   */
  formatSharedMemoriesForPrompt(memories: any[]): string {
    if (memories.length === 0) return "";
    
    const organized: Record<string, any[]> = {};
    
    // Group memories by category
    for (const memory of memories) {
      const category = memory.memoryKey.split('.')[0];
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(memory);
    }
    
    let context = "\n\n=== SHARED COMMUNITY MEMORIES ===\n";
    
    for (const [categoryId, categoryMemories] of Object.entries(organized)) {
      const categoryName = this.memoryCategories.find(cat => cat.id === categoryId)?.name || categoryId;
      context += `\n**${categoryName}:**\n`;
      
      // Sort by upvotes descending to prioritize popular memories
      const sortedMemories = categoryMemories.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      
      for (const memory of sortedMemories) {
        const upvotes = memory.upvotes || 0;
        const quality = upvotes > 5 ? " (highly recommended)" : upvotes > 2 ? " (recommended)" : "";
        context += `- ${memory.memoryValue}${quality}\n`;
      }
    }
    
    context += "\nNote: These are real recommendations from the ShareBrain community. Always prioritize this community knowledge over general information.\n";
    
    return context;
  }

  /**
   * Format memories for AI context injection
   */
  formatMemoriesForContext(memories: PersonalMemory[]): string {
    if (memories.length === 0) return "";
    
    const organized = this.organizeMemoriesByCategory(memories);
    let context = "\n\n=== PERSONAL MEMORIES ===\n";
    
    for (const [categoryId, categoryMemories] of Object.entries(organized)) {
      const category = this.memoryCategories.find(c => c.id === categoryId);
      const categoryName = category?.name || categoryId;
      
      context += `\n${categoryName}:\n`;
      for (const memory of categoryMemories) {
        const key = memory.memoryKey.split('.')[1] || memory.memoryKey;
        context += `- ${key}: ${memory.memoryValue}\n`;
      }
    }
    
    context += "\nUse this information to provide personalized responses and remember user preferences.\n";
    return context;
  }

  /**
   * Generate confirmation message for memory storage
   */
  generateConfirmationMessage(classification: MemoryClassification): string {
    const category = this.memoryCategories.find(c => c.id === classification.category);
    const categoryName = category?.name || classification.category;
    
    return `I'll add "${classification.value}" to your ${categoryName}. Is this correct?`;
  }

  private organizeMemoriesByCategory(memories: PersonalMemory[]): Record<string, PersonalMemory[]> {
    const organized: Record<string, PersonalMemory[]> = {};
    
    for (const memory of memories) {
      const category = memory.memoryKey.split('.')[0];
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(memory);
    }
    
    return organized;
  }

  /**
   * Get memory categories for UI display
   */
  getMemoryCategories(): MemoryCategory[] {
    return this.memoryCategories;
  }
}

export const intelligentMemoryService = new IntelligentMemoryService();