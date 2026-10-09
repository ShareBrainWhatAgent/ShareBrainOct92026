import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { db } from "../db";
import { brainModifications, brainVersions, agents } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ModificationRequest {
  brainId: number;
  instruction: string;
  aiProvider: 'claude' | 'gpt4' | 'codex';
  modificationScope: 'content' | 'system_prompt' | 'code' | 'structure';
}

export interface ModificationResult {
  id: number;
  proposedChanges: any;
  previewContent: string;
  estimatedImpact: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export class BrainModificationService {
  
  async generateModification(userId: string, request: ModificationRequest): Promise<ModificationResult> {
    try {
      // Get current brain data
      const [brain] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, request.brainId), eq(agents.userId, userId)));
      
      if (!brain) {
        throw new Error('Brain not found or access denied');
      }

      // Create version backup before modification
      await this.createVersionBackup(request.brainId, userId, 'Pre-AI modification backup');

      // Generate AI-powered modification based on scope
      const { proposedChanges, previewContent, estimatedImpact } = await this.generateAIModification(
        brain, 
        request.instruction, 
        request.aiProvider, 
        request.modificationScope
      );

      // Save modification to database
      const [modification] = await db
        .insert(brainModifications)
        .values({
          brainId: request.brainId,
          userId: userId,
          instruction: request.instruction,
          aiProvider: request.aiProvider,
          modificationScope: request.modificationScope,
          status: 'pending_review',
          proposedChanges: proposedChanges,
          previewContent: previewContent,
          estimatedImpact: estimatedImpact,
        })
        .returning();

      return {
        id: modification.id,
        proposedChanges: modification.proposedChanges,
        previewContent: modification.previewContent,
        estimatedImpact: modification.estimatedImpact,
        status: modification.status as 'pending_review'
      };

    } catch (error: any) {
      console.error('Brain modification generation failed:', error);
      throw new Error(`Failed to generate modification: ${error.message}`);
    }
  }

  async applyModification(userId: string, modificationId: number): Promise<void> {
    try {
      // Get modification
      const [modification] = await db
        .select()
        .from(brainModifications)
        .where(and(eq(brainModifications.id, modificationId), eq(brainModifications.userId, userId)));
      
      if (!modification || modification.status !== 'pending_review') {
        throw new Error('Modification not found or not pending review');
      }

      // Apply changes to brain
      const changes = modification.proposedChanges as any;
      const updateData: any = {};

      if (changes.systemPrompt) updateData.systemPrompt = changes.systemPrompt;
      if (changes.name) updateData.name = changes.name;
      if (changes.description) updateData.description = changes.description;
      if (changes.category) updateData.category = changes.category;
      if (changes.model) updateData.model = changes.model;
      if (changes.temperature) updateData.temperature = changes.temperature;

      await db
        .update(agents)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(agents.id, modification.brainId));

      // Mark modification as applied
      await db
        .update(brainModifications)
        .set({ 
          status: 'applied',
          appliedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(brainModifications.id, modificationId));

    } catch (error: any) {
      console.error('Brain modification application failed:', error);
      throw new Error(`Failed to apply modification: ${error.message}`);
    }
  }

  async rejectModification(userId: string, modificationId: number, reason: string): Promise<void> {
    try {
      await db
        .update(brainModifications)
        .set({ 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason,
          updatedAt: new Date()
        })
        .where(and(eq(brainModifications.id, modificationId), eq(brainModifications.userId, userId)));
    } catch (error: any) {
      console.error('Brain modification rejection failed:', error);
      throw new Error(`Failed to reject modification: ${error.message}`);
    }
  }

  async getModificationHistory(userId: string, brainId: number): Promise<any[]> {
    try {
      return await db
        .select()
        .from(brainModifications)
        .where(and(eq(brainModifications.brainId, brainId), eq(brainModifications.userId, userId)))
        .orderBy(desc(brainModifications.createdAt));
    } catch (error: any) {
      console.error('Failed to get modification history:', error);
      throw new Error('Failed to retrieve modification history');
    }
  }

  async createVersionBackup(brainId: number, userId: string, description: string): Promise<number> {
    try {
      // Get current brain data
      const [brain] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, brainId));
      
      if (!brain) {
        throw new Error('Brain not found');
      }

      // Get next version number
      const existingVersions = await db
        .select()
        .from(brainVersions)
        .where(eq(brainVersions.brainId, brainId));
      
      const nextVersion = existingVersions.length + 1;

      // Create version snapshot
      const [version] = await db
        .insert(brainVersions)
        .values({
          brainId: brainId,
          versionNumber: nextVersion,
          description: description,
          brainSnapshot: brain as any,
          createdBy: userId,
        })
        .returning();

      return version.id;
    } catch (error: any) {
      console.error('Version backup creation failed:', error);
      throw new Error(`Failed to create version backup: ${error.message}`);
    }
  }

  private async generateAIModification(
    brain: any, 
    instruction: string, 
    aiProvider: string, 
    scope: string
  ): Promise<{ proposedChanges: any; previewContent: string; estimatedImpact: string; }> {
    
    const contextPrompt = `You are helping modify an AI agent/brain with these current properties:
Name: ${brain.name}
Description: ${brain.description}
Category: ${brain.category}
System Prompt: ${brain.systemPrompt || 'None'}
Model: ${brain.model}
Temperature: ${brain.temperature}

User Request: "${instruction}"
Modification Scope: ${scope}

Based on this request, generate specific modifications for the ${scope} scope. Return a JSON response with:
{
  "proposedChanges": {
    // Specific fields to modify based on scope
  },
  "previewContent": "Clear description of what will change",
  "estimatedImpact": "Assessment of how this will affect the brain's behavior"
}`;

    try {
      let result: string;

      switch (aiProvider) {
        case 'claude':
          const claudeResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{ 
              role: 'user', 
              content: `${contextPrompt}\n\nRespond with valid JSON only.` 
            }]
          });
          result = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
          break;

        case 'gpt4':
          const gptResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            messages: [
              { role: 'system', content: 'You are an AI agent modification expert. Always respond with valid JSON.' },
              { role: 'user', content: contextPrompt }
            ],
            response_format: { type: "json_object" }
          });
          result = gptResponse.choices[0].message.content || '{}';
          break;

        case 'codex':
          // Use GPT-4 for now since Codex is deprecated
          const codexResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            messages: [
              { role: 'system', content: 'You are a code-focused AI agent modification expert. Focus on implementation details. Always respond with valid JSON.' },
              { role: 'user', content: contextPrompt }
            ],
            response_format: { type: "json_object" }
          });
          result = codexResponse.choices[0].message.content || '{}';
          break;

        default:
          throw new Error(`Unsupported AI provider: ${aiProvider}`);
      }

      const parsedResult = JSON.parse(result);
      
      return {
        proposedChanges: parsedResult.proposedChanges || {},
        previewContent: parsedResult.previewContent || 'AI-generated modifications ready for review',
        estimatedImpact: parsedResult.estimatedImpact || 'Impact assessment unavailable'
      };

    } catch (error: any) {
      console.error(`AI modification generation failed with ${aiProvider}:`, error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
}

export const brainModificationService = new BrainModificationService();