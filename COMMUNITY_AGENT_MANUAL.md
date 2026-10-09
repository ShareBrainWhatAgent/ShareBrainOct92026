# Community Agent Manual
*Version 1.0 - July 18, 2025*

## Overview

Community Agents are a revolutionary type of AI agent where **all user messages are publicly visible** in a shared, transparent feed. This creates an open community environment where users can see real-time conversations and AI-powered summaries provide insights into daily, weekly, and topic-based discussions.

## Core Principles

### 1. **Complete Transparency**
- Every message from every user is publicly visible
- No private conversations - everything is in the open
- Users understand their messages will be seen by others
- Creates accountability and community engagement

### 2. **AI-Powered Insights**
- Daily summaries of community discussions
- Weekly trend analysis and topic clustering
- Real-time topic extraction and categorization
- Automatic identification of key themes and insights

### 3. **Community-Driven Learning**
- Agent learns from collective community wisdom
- Shared knowledge base grows with each interaction
- Community feedback influences agent responses
- Collaborative problem-solving approach

## Technical Architecture

### Database Schema

#### Community Messages Table
```sql
community_messages:
- id: serial primary key
- agent_id: integer (references agents.id)
- user_id: varchar (nullable for agent messages)
- user_handle: varchar (display name)
- agent_name: varchar (display name)
- role: text ('user' or 'assistant')
- content: text (message content)
- message_type: text ('text', 'image', 'system')
- metadata: json (response time, tokens, etc.)
- is_visible: boolean (for moderation)
- created_at: timestamp
```

#### Community Summaries Table
```sql
community_summaries:
- id: serial primary key
- agent_id: integer (references agents.id)
- summary_type: text ('daily', 'weekly', 'topic', 'monthly')
- summary_period: text ('2025-01-18', '2025-W03', 'topic-ai-safety')
- title: text (summary title)
- content: text (AI-generated summary)
- message_count: integer (messages analyzed)
- user_count: integer (unique users involved)
- key_topics: json (extracted topics array)
- metadata: json (AI analysis metadata)
- created_at: timestamp
- updated_at: timestamp
```

### Agent Configuration
```javascript
{
  isCommunityAgent: true,
  isPrivate: false, // Must be public
  hasSharedMemory: true, // Learn from all interactions
  systemPrompt: "Community-focused prompt emphasizing transparency..."
}
```

## Implementation Standards

### 1. **Message Storage**
- All messages must be stored in `community_messages` table
- Include user handle and agent name for display
- Maintain metadata for performance tracking
- Enable moderation through `is_visible` flag

### 2. **Real-Time Display**
- Messages appear in chronological order
- Auto-refresh every 2-3 seconds for live updates
- Show user handles prominently
- Distinguish user vs agent messages clearly

### 3. **AI Summarization**
- Generate daily summaries at midnight
- Create weekly summaries on Sundays
- Detect topics with 10+ messages for topic summaries
- Use Llama 3.1 70B for all summarization tasks

### 4. **Privacy Safeguards**
- Clear warnings that all messages are public
- User consent required before first message
- Moderation tools for inappropriate content
- Easy opt-out mechanism

## User Experience Guidelines

### 1. **Onboarding Flow**
```
1. User selects Community Agent
2. Privacy warning: "All messages are public"
3. User acknowledges transparency
4. Welcome message explaining community nature
5. User can start participating
```

### 2. **Interface Design**
- **Public Feed**: Scrolling list of all messages
- **Live Indicator**: Show when others are typing
- **Summary Panel**: Display recent AI summaries
- **Topic Tags**: Clickable topics for filtering
- **User Count**: Show active community size

### 3. **Moderation Features**
- Report inappropriate messages
- Community voting on message quality
- Admin controls for content removal
- Automatic filtering of spam/abuse

## AI Summarization System

### Daily Summaries
```javascript
{
  type: "daily",
  period: "2025-01-18",
  title: "Community Insights - January 18, 2025",
  content: "Today's 47 messages from 12 users focused on...",
  keyTopics: ["AI Ethics", "Climate Change", "Technology"],
  messageCount: 47,
  userCount: 12
}
```

### Weekly Summaries
```javascript
{
  type: "weekly", 
  period: "2025-W03",
  title: "Week 3 Community Trends",
  content: "This week saw increased discussion about...",
  keyTopics: ["Future of Work", "AI Safety", "Education"],
  messageCount: 234,
  userCount: 45
}
```

### Topic Summaries
```javascript
{
  type: "topic",
  period: "topic-ai-safety",
  title: "AI Safety Discussion Summary",
  content: "Community members explored various aspects...",
  keyTopics: ["Alignment", "Control Problem", "Governance"],
  messageCount: 89,
  userCount: 23
}
```

## API Endpoints

### Community Messages
- `GET /api/community/:agentId/messages` - Get public message feed
- `POST /api/community/:agentId/messages` - Send public message
- `GET /api/community/:agentId/messages/live` - Real-time updates

### Community Summaries  
- `GET /api/community/:agentId/summaries` - Get all summaries
- `GET /api/community/:agentId/summaries/daily/:date` - Daily summary
- `GET /api/community/:agentId/summaries/weekly/:week` - Weekly summary
- `GET /api/community/:agentId/summaries/topic/:topic` - Topic summary
- `POST /api/community/:agentId/summaries/generate` - Generate new summary

### Community Stats
- `GET /api/community/:agentId/stats` - Community statistics
- `GET /api/community/:agentId/topics` - Active topics
- `GET /api/community/:agentId/users` - Active users count

## Best Practices

### 1. **Agent Creation**
- Always reference this manual when creating Community Agents
- Use standard system prompts emphasizing community nature
- Enable all community features by default
- Include privacy warnings in agent description

### 2. **Content Moderation**
- Implement real-time content filtering
- Provide clear community guidelines
- Enable user reporting mechanisms
- Maintain audit logs for all moderation actions

### 3. **Performance Optimization**
- Cache frequently accessed summaries
- Use pagination for message feeds
- Implement efficient real-time updates
- Monitor database performance with community growth

### 4. **Community Health**
- Track engagement metrics
- Monitor topic diversity
- Identify and address toxic behavior
- Celebrate positive community interactions

## Future Enhancements

### 1. **Advanced Features**
- Topic-based chat rooms within community
- User reputation and badges system
- Community polls and voting
- Collaborative document creation

### 2. **AI Improvements**
- Sentiment analysis of community mood
- Predictive topic modeling
- Personalized summary recommendations
- Cross-community trend analysis

### 3. **Governance Tools**
- Community moderator elections
- Democratic rule-making processes
- Transparent moderation logs
- Community feedback on AI summaries

## Security Considerations

### 1. **Data Protection**
- All community data is public by design
- No PII should be stored in messages
- Implement rate limiting to prevent spam
- Regular security audits of public endpoints

### 2. **Content Safety**
- Real-time content scanning
- Automatic filtering of harmful content
- Clear escalation procedures for violations
- Legal compliance with content regulations

## Compliance Requirements

### 1. **Legal Compliance**
- GDPR right to erasure (where applicable)
- Content liability considerations
- Age restrictions for community participation
- Terms of service for public messaging

### 2. **Platform Standards**
- Accessibility requirements for public feeds
- Mobile responsiveness for community interface
- Performance standards for real-time updates
- Data retention policies for public messages

---

**Important**: Always consult this manual before making any changes to Community Agent functionality. All modifications must maintain the core principles of transparency, community engagement, and AI-powered insights.

**Last Updated**: July 18, 2025  
**Version**: 1.0  
**Maintained by**: ShareBrain Development Team