# ShareBrain Memory System Documentation

## Overview

ShareBrain implements a three-tier memory architecture to support different types of AI-human interactions and knowledge sharing patterns.

## Memory Architecture

### Tier 1: Personal Memories
- **Scope**: Private to individual user-agent pairs
- **Table**: `personal_memories`
- **Access**: Only the specific user and their designated agents
- **Use Cases**: Personal preferences, private conversations, individual learning
- **Example**: "I'm allergic to peanuts" (only this user's agents remember)

### Tier 2: Friends Memories  
- **Scope**: Shared among friend groups
- **Table**: `friends_memories`
- **Access**: All friends in a connected group
- **Use Cases**: Shared experiences, group knowledge, social memories
- **Example**: "We went to John's birthday party last week" (all friends remember)

### Tier 3: Shared Memories (Global/Community)
- **Scope**: Community-wide knowledge base
- **Table**: `shared_memories`
- **Access**: All users of that specific agent type
- **Use Cases**: Collective knowledge, community recommendations, shared databases
- **Example**: "Sundance Steakhouse is the best place for steaks in Palo Alto" (everyone learns)

## Agent Types and Memory Configuration

### Universal Brains

#### ShareBrain Restaurant (ID: 347)
- **Memory Type**: Shared Memories (Tier 3)
- **Behavior**: Community-wide restaurant knowledge base
- **Knowledge Source**: Only user contributions
- **Response Mode**: Strict memory-only (no fictional answers)
- **Storage**: All restaurant information stored as shared memories accessible to all users

#### AI Friend Chat (ID: 348)
- **Memory Type**: Personal Memories (Tier 1) + Conversation-specific context
- **Behavior**: Silent unless addressed with "AI" prefix
- **Knowledge Source**: Only conversation history and personal memories
- **Response Mode**: Context-aware but non-intrusive

### Personal Agents
- **Memory Type**: Personal Memories (Tier 1)
- **Behavior**: Individual assistant with private knowledge
- **Knowledge Source**: User's personal information and preferences
- **Response Mode**: Personalized responses based on individual history

### Template Agents (Language Tutors, etc.)
- **Memory Type**: Personal Memories (Tier 1)
- **Behavior**: Individual learning progress tracking
- **Knowledge Source**: User's learning history and preferences
- **Response Mode**: Adaptive based on individual progress

## Implementation Details

### Memory Storage Functions

```typescript
// Personal Memories
await storage.createPersonalMemory({
  userId: string,
  agentId: number,
  memoryKey: string,
  memoryValue: string,
  originalStatement: string
});

// Shared Memories
await storage.createSharedMemory({
  agentId: number,
  memoryKey: string,
  memoryValue: string,
  originalStatement: string,
  upvotes: 0,
  downvotes: 0
});

// Friends Memories
await storage.createFriendsMemory({
  userId: string,
  agentId: number,
  memoryKey: string,
  memoryValue: string,
  originalStatement: string
});
```

### Memory Retrieval in Agent Responses

```typescript
// Personal Memories (default for most agents)
if (agent.id !== 347) {
  const personalMemories = await db.select()
    .from(personalMemories)
    .where(and(
      eq(personalMemories.userId, userId),
      eq(personalMemories.agentId, agent.id)
    ));
}

// Shared Memories (for ShareBrain Restaurant Brain)
if (agent.id === 347) {
  const sharedMemories = await storage.getSharedMemories(agent.id);
  systemPrompt += formatSharedMemoriesForPrompt(sharedMemories);
}
```

## Critical Rules

### ShareBrain Restaurant Brain (ID: 347)
1. **ONLY** use shared memories for responses
2. **NEVER** generate fictional restaurant information
3. If no memory exists, respond with "I don't have information about that yet"
4. Store ALL restaurant information as shared memories for community access
5. Enforce strict memory-only mode

### AI Friend Chat (ID: 348)
1. Only respond when message starts with "AI"
2. Use personal memories for conversation context
3. Stay silent during normal friend conversations
4. Access conversation-specific memory only

### Memory Storage Rules
1. **Personal information** → Personal Memories
2. **Restaurant/business information** → Shared Memories (if ShareBrain Restaurant)
3. **Friend group experiences** → Friends Memories
4. **Individual learning progress** → Personal Memories

## Development Guidelines

### When Adding New Memory Features
1. Identify the correct memory tier (Personal/Friends/Shared)
2. Update the appropriate storage functions
3. Modify agent response generation logic
4. Add proper memory retrieval in `generateAgentResponses`
5. Test cross-user memory access patterns
6. Update this documentation

### When Creating New Agent Types
1. Determine memory scope requirements
2. Configure appropriate memory tier
3. Set response mode (memory-only vs memory+general knowledge)
4. Implement memory storage logic
5. Add agent-specific memory handling in routes

### Debugging Memory Issues
1. Check agent ID and memory tier configuration
2. Verify memory storage is using correct table
3. Confirm memory retrieval uses proper filtering
4. Test with multiple users to verify scope
5. Check system prompt includes memory context

## Current Issues

### ShareBrain Restaurant Brain Bug (Fixed)
- **Problem**: Using personal memories instead of shared memories
- **Impact**: Restaurant information not shared across users
- **Solution**: Switch to shared memory system with strict memory-only responses

## Future Enhancements

1. **Memory Validation**: Community upvoting/downvoting for shared memories
2. **Memory Expiration**: Time-based memory aging
3. **Memory Categories**: Structured categorization for better retrieval
4. **Cross-Agent Memory**: Memories shared between related agent types
5. **Memory Analytics**: Usage tracking and optimization