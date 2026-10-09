import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Together AI client for Llama models
const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MemoryRequest {
  isMemoryRequest: boolean;
  memoryKey?: string;
  memoryValue?: string;
  originalStatement?: string;
}

export async function generateAgentResponse(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  modelName: string = "gpt-4o",
  temperature: number = 0.7,
  maxTokens: number = 2048
): Promise<{
  content: string;
  responseTime: number;
  tokensUsed: number;
}> {
  const startTime = Date.now();
  
  try {
    // Build messages with conversation context
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: userMessage }
    ];

    // Map model names to their respective API identifiers and clients
    const modelMap: { [key: string]: { model: string; client: 'openai' | 'together' } } = {
      "GPT-4": { model: "gpt-4o", client: "openai" },
      "GPT-3.5 Turbo": { model: "gpt-3.5-turbo", client: "openai" },
      "Llama 3.1 405B": { model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", client: "together" }, // Fallback to 8B for now
      "Llama 3.1 70B": { model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", client: "together" }, // Fallback to 8B for now
      "Llama 3.1 8B": { model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", client: "together" },
      "Claude-3 Opus": { model: "gpt-4o", client: "openai" }, // Fallback to GPT-4o for non-supported models
      "Claude-3 Sonnet": { model: "gpt-4o", client: "openai" },
      "Gemini Pro": { model: "gpt-4o", client: "openai" }
    };

    const modelConfig = modelMap[modelName] || { model: "gpt-4o", client: "openai" };
    const client = modelConfig.client === 'together' ? together : openai;

    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      content: response.choices[0].message.content || "I apologize, but I couldn't generate a response.",
      responseTime,
      tokensUsed: response.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response if API fails
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      content: "I'm experiencing technical difficulties right now. Please try again in a moment.",
      responseTime,
      tokensUsed: 0
    };
  }
}

export async function generateSpeech(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  model: "tts-1" | "tts-1-hd" = "tts-1"
): Promise<{
  audio: Buffer;
  responseTime: number;
}> {
  const startTime = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }
    
    const response = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: "mp3",
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const responseTime = Date.now() - startTime;
    
    return {
      audio: buffer,
      responseTime
    };
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate speech: " + (error as Error).message);
  }
}

export async function isOpenAIAvailable(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return false;
    }
    
    // Test with a minimal request
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1,
    });
    
    return true;
  } catch (error) {
    console.error("OpenAI not available:", error);
    return false;
  }
}

/**
 * Detects if user message contains a request to remember personal information
 * Based on the guidelines provided for Personal Agent functionality
 */
export function detectMemoryRequest(message: string): MemoryRequest {
  // Patterns that indicate memory requests
  const rememberPatterns = [
    /remember that (.+)/i,
    /please remember (.+)/i,
    /don't forget that (.+)/i,
    /my favorite (\w+(?:\s+\w+)*) is (.+)/i,
    /i like (.+)/i,
    /i don't like (.+)/i,
    /(.+) is the best (.+?) in (.+)/i,
    /(.+) is my (.+)/i,
    /my (.+) is (.+)/i,
    /i prefer (.+)/i,
    /i am (.+)/i,
    /my name is (.+)/i,
    /call me (.+)/i,
    /i live in (.+)/i,
    /my address is (.+)/i,
    /my birthday is (.+)/i,
    /i work at (.+)/i,
    /my job is (.+)/i
  ];

  for (const pattern of rememberPatterns) {
    const match = message.match(pattern);
    if (match) {
      const fullMatch = match[1] || match[2] || match[0];
      const { key, value } = extractKeyValueFromStatement(fullMatch, match);
      return {
        isMemoryRequest: true,
        memoryKey: key,
        memoryValue: value,
        originalStatement: fullMatch
      };
    }
  }

  return { isMemoryRequest: false };
}

/**
 * Extracts key-value pairs from memory statements
 */
function extractKeyValueFromStatement(statement: string, match?: RegExpMatchArray): { key: string; value: string } {
  if (!match) {
    // Generic extraction for statements like "remember that..."
    return {
      key: "general_info",
      value: statement.trim()
    };
  }

  // Pattern-specific extraction
  const originalPattern = match.input;
  
  if (originalPattern?.includes("favorite")) {
    // Extract the item after "favorite" from the statement
    const favoriteMatch = statement.match(/favorite\s+(.+?)\s+(?:is|are|at)\s+(.+)/i);
    if (favoriteMatch) {
      return {
        key: `favorite_${favoriteMatch[1].toLowerCase().replace(/\s+/g, '_')}`,
        value: favoriteMatch[2].trim()
      };
    }
    // Fallback for simpler patterns
    return {
      key: "favorite_item",
      value: statement.trim()
    };
  }
  
  if (originalPattern?.includes("my name is") || originalPattern?.includes("call me")) {
    return {
      key: "name",
      value: match[1].trim()
    };
  }
  
  if (originalPattern?.includes("i live in") || originalPattern?.includes("my address")) {
    return {
      key: "location",
      value: match[1].trim()
    };
  }
  
  if (originalPattern?.includes("i work at") || originalPattern?.includes("my job")) {
    return {
      key: "occupation",
      value: match[1].trim()
    };
  }
  
  if (originalPattern?.includes("birthday")) {
    return {
      key: "birthday",
      value: match[1].trim()
    };
  }
  
  if (originalPattern?.includes("i like")) {
    return {
      key: "likes",
      value: match[1].trim()
    };
  }
  
  if (originalPattern?.includes("i don't like")) {
    return {
      key: "dislikes",
      value: match[1].trim()
    };
  }
  
  if (originalPattern?.includes("i prefer")) {
    return {
      key: "preferences",
      value: match[1].trim()
    };
  }

  // Default extraction
  return {
    key: "general_info",
    value: statement.trim()
  };
}

/**
 * Formats stored memories into context for system prompt
 */
export function formatMemoriesForPrompt(memories: any[]): string {
  if (!memories.length) return "";
  
  const memoryText = memories.map(m => 
    `${m.memoryKey.replace(/_/g, ' ')}: ${m.memoryValue}`
  ).join('\n');
  
  return `\n\nPersonal Information to Remember:\n${memoryText}\n\nReference this information when relevant to provide personalized responses.`;
}

/**
 * Formats friends memories into context for system prompt
 */
export function formatFriendsMemoriesForPrompt(memories: any[]): string {
  if (!memories.length) return "";
  
  const memoryText = memories.map(m => 
    `${m.memoryKey.replace(/_/g, ' ')}: ${m.memoryValue} (shared by friend group)`
  ).join('\n');
  
  return `\n\nFriend Group Knowledge:\n${memoryText}\n\nThis information was shared by your friend group. Use it to provide context-aware responses.`;
}

/**
 * Formats shared memories into context for system prompt
 */
export function formatSharedMemoriesForPrompt(memories: any[]): string {
  if (!memories.length) return "";
  
  const memoryText = memories.map(m => 
    `${m.memoryKey.replace(/_/g, ' ')}: ${m.memoryValue} (contributed by community)`
  ).join('\n');
  
  return `\n\nShared Knowledge Base:\n${memoryText}\n\nThis information was contributed by users and represents collective knowledge. Use it to provide better responses.`;
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage(
  prompt: string,
  model: string = "dall-e-3",
  quality: "standard" | "hd" = "standard",
  size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024"
): Promise<{
  url: string;
  revisedPrompt?: string;
}> {
  try {
    const response = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    };
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error("Failed to generate image: " + (error as Error).message);
  }
}