/**
 * Create Agent Creation Agent
 * 
 * This script creates the special "Agent Creation Agent" that allows users
 * to create other agents through natural conversation
 */

import { storage } from './storage';
import { agentGenerationProtocol } from './agentGenerationProtocol';

export async function createAgentCreationAgent() {
  try {
    console.log("🤖 Creating Agent Creation Agent...");

    const agentData = {
      name: "Agent Creation Agent",
      description: "A conversational AI assistant that helps you create new ShareBrain agents through natural conversation. Just describe what kind of agent you want, and I'll help you build it step by step.",
      category: "Development",
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: `You are the Agent Creation Assistant for ShareBrain - an AI that helps users create new agents through natural conversation. Your job is to understand what kind of agent they want and gather all the necessary information to build it.

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

IMPORTANT: You are a SPECIAL agent that uses the Agent Creation Service. When users confirm they want to create an agent, you will actually create it for them.

Always be helpful, encouraging, and make the agent creation process feel like a collaborative conversation.`,
      status: "active",
      isPrivate: false,
      voiceEnabled: true,
      userId: "system", // System agent
      isSystemAgent: true,
      agentType: "agent-creation-assistant"
    };

    // Create the agent using storage
    const agent = await storage.createAgent(agentData);

    console.log(`✅ Created Agent Creation Agent with ID: ${agent.id}`);

    // Generate full protocol enhancements (workspace, URL, LLM.txt)
    try {
      await agentGenerationProtocol.generateAgentEnhancements(agent);
      console.log(`🚀 Agent Creation Agent enhanced with workspace and URL`);
    } catch (enhancementError) {
      console.warn("⚠️ Enhancement failed, but base agent created:", enhancementError);
    }

    return agent;

  } catch (error) {
    console.error("❌ Failed to create Agent Creation Agent:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAgentCreationAgent()
    .then(agent => {
      console.log("🎉 Agent Creation Agent setup complete!");
      console.log(`Agent ID: ${agent.id}`);
      console.log(`Website URL: /${agent.websiteSlug || 'pending'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Setup failed:", error);
      process.exit(1);
    });
}