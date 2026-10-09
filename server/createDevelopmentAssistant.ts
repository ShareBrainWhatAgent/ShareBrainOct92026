/**
 * Create Development Assistant Agent powered by Claude
 * This agent provides direct access to Claude for ShareBrain development assistance
 */

import { db } from './db';
import { agents, agentWorkspaces } from '../shared/schema';
import { eq } from 'drizzle-orm';

export async function createDevelopmentAssistant() {
  try {
    console.log("🤖 Creating Development Assistant Agent...");

    // Check if Development Assistant already exists (ID 373)
    const existingAgent = await db.select().from(agents).where(eq(agents.id, 373)).limit(1);
    
    if (existingAgent.length > 0) {
      console.log("✅ Development Assistant Agent (ID 373) already exists");
      return existingAgent[0];
    }

    // Create Development Assistant Agent
    const [developmentAssistant] = await db.insert(agents).values({
      id: 373,
      name: "Development Assistant",
      description: "Direct access to Claude for ShareBrain development help, technical guidance, and advanced agent creation assistance.",
      systemPrompt: `You are the ShareBrain Development Assistant, powered by Claude. This is a meta-agent that routes directly to Claude's API for sophisticated development assistance.

## Your Purpose:
Help users with ShareBrain platform development, technical questions, and advanced agent creation guidance.

## Key Capabilities:
- ShareBrain platform architecture and features
- AI agent development best practices
- Technical troubleshooting and guidance
- Advanced agent creation and optimization
- Code examples and implementation help

## Special Note:
This agent uses Claude's API directly, providing access to advanced reasoning and development assistance within the ShareBrain platform.`,
      model: "claude-sonnet-4-20250514",
      temperature: 0.7,
      maxTokens: 2048,
      category: "Development",
      status: "active",
      isPersonal: false,
      isPubliclyVisible: false,
      isTemplate: false,
      isSystemAgent: true,
      userId: "system",
      sampleUser: "I need help creating an agent for my business. Can you guide me through the process?",
      sampleAgent: "I'd be happy to help you create an effective agent! Let me guide you through ShareBrain's agent creation process. First, let's understand your specific use case - what kind of business do you have and what tasks would you like the agent to handle?",
      hasSharedMemory: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Create workspace for Development Assistant
    const [workspace] = await db.insert(agentWorkspaces).values({
      agentId: 373,
      name: "Development Assistant",
      description: "Claude-powered development assistance for ShareBrain platform",
      systemPrompt: developmentAssistant.systemPrompt,
      websiteSlug: "development-assistant",
      status: "active",
      replitUrl: `https://${process.env.REPLIT_SLUG || 'sharebrain'}.${process.env.REPLIT_CLUSTER || 'replit'}.dev/agent-website/development-assistant`,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log("✅ Development Assistant Agent created successfully with ID 373");
    console.log("🔗 Agent workspace and URL configured");
    
    return developmentAssistant;
    
  } catch (error) {
    console.error("❌ Failed to create Development Assistant Agent:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDevelopmentAssistant()
    .then(() => {
      console.log("🎉 Development Assistant creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Development Assistant creation failed:", error);
      process.exit(1);
    });
}