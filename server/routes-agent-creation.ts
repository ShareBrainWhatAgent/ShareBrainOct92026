/**
 * Agent Creation Agent Routes
 * 
 * API endpoints for the conversational agent creation system
 */

import { Router } from 'express';
import { agentCreationService } from './claudeIntegrationService';
import { storage } from './storage';

const router = Router();

/**
 * POST /api/agent-creation/chat
 * Main endpoint for conversational agent creation
 */
router.post('/chat', async (req: any, res) => {
  try {
    const { message, conversationHistory, sessionData } = req.body;
    const userId = req.user?.claims?.sub || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`🤖 Agent Creation Agent request from user ${userId}: "${message}"`);

    // Process the message through the agent creation service
    const response = await agentCreationService.processAgentCreationRequest(message, {
      userId,
      conversationHistory,
      sessionData
    });

    console.log(`✅ Agent Creation response type: ${response.type}`);
    
    if (response.createdAgentId) {
      console.log(`🎉 Created new agent with ID: ${response.createdAgentId}`);
    }

    res.json(response);

  } catch (error) {
    console.error('Agent creation chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process agent creation request',
      fallback: true,
      content: `I'm having trouble right now, but I'd still love to help you create an agent! 

Let's start simple: What kind of agent do you want to build?

For example:
- "A customer service agent for my online store"
- "A Spanish tutor for beginners" 
- "A creative writing assistant"
- "A technical support helper"

Just describe your idea and I'll help you build it!`,
      type: 'conversation',
      nextSteps: [
        "I want a business assistant",
        "Create a learning tutor",
        "Build a creative helper"
      ]
    });
  }
});

/**
 * GET /api/agent-creation/templates
 * Get suggested agent templates for inspiration
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        name: "Customer Service Agent",
        description: "Professional support agent for businesses",
        category: "Business",
        example: "Create a friendly customer service agent that helps with product questions and support tickets"
      },
      {
        name: "Language Tutor",
        description: "Interactive language learning assistant", 
        category: "Education",
        example: "Build a Spanish tutor that teaches vocabulary and helps with pronunciation"
      },
      {
        name: "Creative Writing Assistant",
        description: "Helps with stories, poems, and creative content",
        category: "Creative",
        example: "Make a writing assistant that helps brainstorm ideas and improve stories"
      },
      {
        name: "Technical Support Helper",
        description: "Assists with technical troubleshooting",
        category: "Technical", 
        example: "Create a tech support agent that helps users fix common computer problems"
      },
      {
        name: "Personal Productivity Coach",
        description: "Helps with time management and productivity",
        category: "Productivity",
        example: "Build a productivity coach that helps organize tasks and improve habits"
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Error fetching agent templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * POST /api/agent-creation/quick-create
 * Quick agent creation from template
 */
router.post('/quick-create', async (req: any, res) => {
  try {
    const { template, customization } = req.body;
    const userId = req.user?.claims?.sub || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`⚡ Quick creating agent from template: ${template}`);

    // Use the conversation service to create agent from template
    const response = await agentCreationService.processAgentCreationRequest(
      `Create a ${template} agent. ${customization || ''}. Yes, create it now.`,
      { userId }
    );

    res.json(response);

  } catch (error) {
    console.error('Quick create error:', error);
    res.status(500).json({ error: 'Failed to create agent from template' });
  }
});

export default router;