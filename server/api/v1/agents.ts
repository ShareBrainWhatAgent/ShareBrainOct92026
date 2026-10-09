import { Request, Response, NextFunction } from "express";
import { storage } from "../../storage";
import { generateAgentResponse, isOpenAIAvailable } from "../../openai";
import { z } from "zod";

// API Key middleware - Debug version
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🔑 API Key middleware called at:", new Date().toISOString());
  console.log("🔑 Request URL:", req.url);
  console.log("🔑 Request method:", req.method);
  
  try {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace("Bearer ", "");
    
    console.log("🔑 Auth header:", authHeader);
    console.log("🔑 Extracted API key:", apiKey);
    
    if (!apiKey) {
      console.log("❌ No API key provided");
      return res.status(401).json({
        error: {
          message: "No API key provided",
          type: "authentication_error",
          param: null,
          code: "missing_api_key"
        }
      });
    }
    
    // Validate API key against database
    const crypto = await import('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    console.log("🔑 Generated key hash:", keyHash);
    
    // Direct database lookup for reliability
    const pkg = await import('pg');
    const { Pool } = pkg.default;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query('SELECT * FROM api_keys WHERE key_hash = $1', [keyHash]);
    console.log("🔑 Database lookup result:", result.rows);
    
    if (result.rows.length === 0) {
      console.log("❌ API key not found in database");
      await pool.end();
      return res.status(401).json({
        error: {
          message: "Invalid API key provided",
          type: "authentication_error",
          param: null,
          code: "invalid_api_key"
        }
      });
    }
    
    const validApiKey = result.rows[0];
    console.log("🔑 Found API key:", {
      id: validApiKey.id,
      name: validApiKey.name,
      isActive: validApiKey.is_active,
      userId: validApiKey.user_id
    });
    
    if (!validApiKey.is_active) {
      console.log("❌ API key is not active");
      await pool.end();
      return res.status(401).json({
        error: {
          message: "API key is not active",
          type: "authentication_error",
          param: null,
          code: "inactive_api_key"
        }
      });
    }
    
    console.log("✅ API key authentication successful!");
    
    // Update usage count
    await pool.query('UPDATE api_keys SET last_used = NOW(), usage_count = usage_count + 1 WHERE key_hash = $1', [keyHash]);
    
    await pool.end();
    
    // Attach API key info to request for rate limiting
    req.apiKey = apiKey;
    req.apiKeyData = validApiKey;
    next();
  } catch (error) {
    console.error("💥 API key authentication error:", error);
    return res.status(500).json({
      error: {
        message: "Internal server error",
        type: "server_error",
        param: null,
        code: "internal_error"
      }
    });
  }
};

// Rate limiting middleware (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

/**
 * Remove stale rate limit entries to avoid unbounded memory growth.
 */
function cleanupRateLimitMap(now: number) {
  for (const [key, usage] of rateLimitMap.entries()) {
    if (usage.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.apiKey!;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean out any expired entries on each request
  cleanupRateLimitMap(now);
  
  let usage = rateLimitMap.get(apiKey);
  if (!usage || usage.resetTime < windowStart) {
    usage = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(apiKey, usage);
  }
  
  if (usage.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: {
        message: "Rate limit exceeded. Please try again later.",
        type: "rate_limit_error",
        param: null,
        code: "rate_limit_exceeded"
      }
    });
  }
  
  usage.count++;
  next();
};

// Validation schemas - Support both OpenAI-style and ShareBrain-style requests
const respondSchema = z.object({
  input: z.string().optional(),
  message: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string()
  })).optional(),
  context: z.object({
    user_id: z.string().optional(),
    session: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }).optional(),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(4096).optional()
}).refine((data) => {
  // At least one of input, message, or messages must be provided
  return data.input || data.message || (data.messages && data.messages.length > 0);
}, {
  message: "At least one of 'input', 'message', or 'messages' is required"
});

const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional().default("meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().min(1).max(4096).optional().default(2048),
  system_prompt: z.string().optional(),
  voice_enabled: z.boolean().optional().default(false),
  voice_type: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional().default("alloy"),
  voice_model: z.enum(["tts-1", "tts-1-hd"]).optional().default("tts-1")
});

// GET /v1/agents - List all agents
export const listAgents = async (req: Request, res: Response) => {
  try {
    console.log("🚀 listAgents called - API key authentication passed!");
    
    // Direct database query to get active agents
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query('SELECT * FROM agents WHERE status = $1 AND is_private = $2 ORDER BY created_at DESC LIMIT 50', ['active', false]);
    console.log("🔍 Found", result.rows.length, "agents in database");
    
    await pool.end();
    
    const agents = result.rows.map(agent => ({
      id: agent.id.toString(),
      object: "agent",
      name: agent.name,
      description: agent.description || "",
      category: agent.category || "",
      model: agent.model || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      created: Math.floor(new Date(agent.created_at).getTime() / 1000), // Unix timestamp
      voice_enabled: agent.voice_enabled || false,
      status: agent.status || "active"
    }));
    
    console.log("✅ Returning", agents.length, "agents");
    res.json({
      object: "list",
      data: agents
    });
  } catch (error) {
    console.error("💥 Error in listAgents:", error);
    res.status(500).json({
      error: {
        message: "Internal server error",
        type: "internal_server_error",
        param: null,
        code: "internal_error"
      }
    });
  }
};

// GET /v1/agents/:id - Get specific agent
export const getAgent = async (req: Request, res: Response) => {
  try {
    const agentId = parseInt(req.params.id);
    if (isNaN(agentId)) {
      return res.status(400).json({
        error: {
          message: "Invalid agent ID",
          type: "validation_error",
          param: "id",
          code: "invalid_parameter"
        }
      });
    }

    const agent = await storage.getAgent(agentId);
    if (!agent || agent.isPrivate) {
      return res.status(404).json({
        error: {
          message: "Agent not found",
          type: "not_found_error",
          param: "id",
          code: "agent_not_found"
        }
      });
    }

    res.json({
      id: agent.id.toString(),
      object: "agent",
      name: agent.name,
      description: agent.description,
      category: agent.category,
      model: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      system_prompt: agent.systemPrompt,
      voice_enabled: agent.voiceEnabled || false,
      voice_type: agent.voiceType,
      voice_model: agent.voiceModel,
      status: agent.status,
      created: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Internal server error",
        type: "internal_server_error",
        param: null,
        code: "internal_error"
      }
    });
  }
};

// POST /v1/agents - Create new agent
export const createAgent = async (req: Request, res: Response) => {
  try {
    const validation = createAgentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.errors[0].message,
          type: "validation_error",
          param: validation.error.errors[0].path[0],
          code: "invalid_parameter"
        }
      });
    }

    const data = validation.data;
    
    // For API-created agents, assign to the authenticated user from the API key
    const userId = req.apiKeyData?.user_id || "113943789451641860641";
    
    const agent = await storage.createAgent({
      userId: userId, // Use the actual authenticated user
      name: data.name,
      description: data.description || "",
      category: data.category || "General",
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.max_tokens,
      systemPrompt: data.system_prompt || "",
      status: "active",
      isTemplate: false,
      voiceEnabled: data.voice_enabled,
      voiceType: data.voice_type,
      voiceModel: data.voice_model
    });

    res.status(201).json({
      id: agent.id.toString(),
      object: "agent",
      name: agent.name,
      description: agent.description,
      category: agent.category,
      model: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      system_prompt: agent.systemPrompt,
      voice_enabled: agent.voiceEnabled || false,
      voice_type: agent.voiceType,
      voice_model: agent.voiceModel,
      status: agent.status,
      created: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Internal server error",
        type: "internal_server_error",
        param: null,
        code: "internal_error"
      }
    });
  }
};

// POST /v1/agents/:id/completions - Get agent response (OpenAI-style)
export const getAgentCompletion = async (req: Request, res: Response) => {
  try {
    const agentId = parseInt(req.params.id);
    if (isNaN(agentId)) {
      return res.status(400).json({
        error: {
          message: "Invalid agent ID",
          type: "validation_error",
          param: "id",
          code: "invalid_parameter"
        }
      });
    }

    const validation = respondSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.errors[0].message,
          type: "validation_error",
          param: validation.error.errors[0].path[0],
          code: "invalid_parameter"
        }
      });
    }

    const { input, message, messages, context, stream, temperature, max_tokens } = validation.data;
    
    // Extract the actual message content from different formats
    let actualMessage = input || message;
    if (!actualMessage && messages && messages.length > 0) {
      // Use the last user message if messages array is provided
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      actualMessage = lastUserMessage?.content || messages[messages.length - 1].content;
    }

    const agent = await storage.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({
        error: {
          message: "Agent not found",
          type: "not_found_error",
          param: "id",
          code: "agent_not_found"
        }
      });
    }

    // Check if this is the Agent Creation Agent (ID 372)
    if (agentId === 372) {
      try {
        const { agentCreationService } = await import('../../claudeIntegrationService');
        
        // Check if actualMessage is defined
        if (!actualMessage) {
          return res.status(400).json({
            error: {
              message: "No message content provided",
              type: "validation_error",
              param: "input",
              code: "missing_message"
            }
          });
        }

        // Process message through Agent Creation Service
        const creationResponse = await agentCreationService.processAgentCreationRequest(
          actualMessage, 
          { 
            userId: "api_user", // For API requests, use generic user
            conversationHistory: messages || [],
            sessionData: {}
          }
        );
        
        // Return in API format
        const completionResponse = {
          id: `cmpl-${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "agent-creation-assistant",
          choices: [{
            index: 0,
            message: {
              role: "assistant",
              content: creationResponse.content
            },
            finish_reason: "stop"
          }],
          usage: {
            prompt_tokens: Math.ceil((actualMessage || "").length / 4),
            completion_tokens: Math.ceil(creationResponse.content.length / 4),
            total_tokens: Math.ceil(((actualMessage || "").length + creationResponse.content.length) / 4)
          },
          agent_creation_meta: {
            type: creationResponse.type,
            nextSteps: creationResponse.nextSteps,
            createdAgentId: creationResponse.createdAgentId
          }
        };
        
        console.log(`🤖 Agent Creation Agent API response: ${creationResponse.type}`);
        return res.json(completionResponse);
        
      } catch (creationError) {
        console.error("Agent Creation Service API error:", creationError);
        // Fall through to normal agent processing
      }
    }

    // Check if this is the Development Assistant (ID 373) - Route to Claude
    if (agentId === 373) {
      try {
        const { claudeDirectService } = await import('../../claudeDirectService');
        
        // Check if actualMessage is defined
        if (!actualMessage) {
          return res.status(400).json({
            error: {
              message: "No message content provided",
              type: "validation_error",
              param: "input",
              code: "missing_message"
            }
          });
        }

        // Process message through Claude Direct Service
        const claudeResponse = await claudeDirectService.processDevelopmentQuery(
          actualMessage, 
          { 
            userId: "api_user", // For API requests, use generic user
            conversationHistory: messages || [],
            sessionData: {}
          }
        );
        
        // Return in API format
        const completionResponse = {
          id: `cmpl-${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: claudeResponse.metadata?.model || "claude-sonnet-4-20250514",
          choices: [{
            index: 0,
            message: {
              role: "assistant",
              content: claudeResponse.content
            },
            finish_reason: "stop"
          }],
          usage: claudeResponse.metadata?.usage || {
            prompt_tokens: Math.ceil((actualMessage || "").length / 4),
            completion_tokens: Math.ceil(claudeResponse.content.length / 4),
            total_tokens: Math.ceil(((actualMessage || "").length + claudeResponse.content.length) / 4)
          },
          development_assistant_meta: {
            type: claudeResponse.type,
            powered_by: "claude_api"
          }
        };
        
        console.log(`🧠 Development Assistant (Claude) API response: ${claudeResponse.type}`);
        return res.json(completionResponse);
        
      } catch (claudeError) {
        console.error("Claude Direct Service API error:", claudeError);
        // Fall through to normal agent processing
      }
    }

    if (!await isOpenAIAvailable()) {
      return res.status(503).json({
        error: {
          message: "AI service temporarily unavailable",
          type: "service_unavailable_error",
          param: null,
          code: "service_unavailable"
        }
      });
    }

    // Override agent settings with request parameters if provided
    const finalTemperature = temperature ?? agent.temperature ?? 0.7;
    const finalMaxTokens = max_tokens ?? agent.maxTokens ?? 2048;

    // Check if actualMessage is defined
    if (!actualMessage) {
      return res.status(400).json({
        error: {
          message: "No message content provided",
          type: "validation_error",
          param: "input",
          code: "missing_message"
        }
      });
    }

    const startTime = Date.now();
    const response = await generateAgentResponse(
      agent.systemPrompt || "",
      actualMessage,
      [], // No conversation history for API calls  
      agent.model || "gpt-4o",
      finalTemperature,
      finalMaxTokens
    );
    const endTime = Date.now();

    // Calculate token usage (approximate)
    const promptTokens = Math.ceil((actualMessage || "").length / 4);
    const completionTokens = Math.ceil(response.content.length / 4);
    const totalTokens = promptTokens + completionTokens;

    const completionResponse = {
      id: `cmpl-${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      object: "chat.completion",
      created: Math.floor(startTime / 1000),
      model: agent.model,
      agent_id: agent.id.toString(),
      agent_name: agent.name,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: response.content
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
      },
      context: context || {},
      response_time_ms: endTime - startTime
    };

    if (stream) {
      // For streaming, we'd implement Server-Sent Events here
      // For now, return the complete response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      res.write(`data: ${JSON.stringify(completionResponse)}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    } else {
      res.json(completionResponse);
    }
  } catch (error) {
    console.error("Agent completion error:", error);
    res.status(500).json({
      error: {
        message: "Internal server error",
        type: "internal_server_error",
        param: null,
        code: "internal_error"
      }
    });
  }
};

// GET /v1/usage - Get API usage statistics
export const getUsage = async (req: Request, res: Response) => {
  try {
    const apiKey = req.apiKey!;
    const usage = rateLimitMap.get(apiKey) || { count: 0, resetTime: Date.now() };
    
    res.json({
      object: "usage",
      api_key: apiKey.substring(0, 7) + "...", // Partially masked
      requests_used: usage.count,
      requests_limit: RATE_LIMIT,
      reset_time: Math.floor(usage.resetTime / 1000),
      period: "hour"
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Internal server error",
        type: "internal_server_error",
        param: null,
        code: "internal_error"
      }
    });
  }
};

// Extend Request type for TypeScript
declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}