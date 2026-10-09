# ShareBrain Messaging System Documentation

## CRITICAL DEVELOPMENT RULES - READ BEFORE ANY MESSAGING CHANGES

### Message Ordering Standard (MANDATORY)

**GOLDEN RULE**: All messages MUST be displayed in chronological order (oldest to newest) like WhatsApp, iMessage, and all modern messaging apps.

#### Database Query Rules
1. **ALL message queries MUST use**: `ORDER BY created_at ASC`
2. **NEVER use**: `ORDER BY created_at DESC` followed by `.reverse()`
3. **ALWAYS include ordering**: No message query should be without explicit ordering

#### Frontend Display Rules
1. Messages display **oldest at top, newest at bottom**
2. Auto-scroll to bottom after new messages
3. User can scroll up to see older messages
4. New messages appear at the bottom of the chat

#### Code Review Checklist
Before approving ANY messaging-related PR, verify:
- [ ] All database queries use `ORDER BY created_at ASC`
- [ ] No queries use DESC then reverse
- [ ] Frontend renders messages chronologically
- [ ] Auto-scroll works properly
- [ ] No height constraints that hide messages

### Affected Files and Functions

#### Backend Files
- `server/storage.ts` - `getMessagesByConversation()`
- `server/routes.ts` - All message-related endpoints
- Any file with message queries

#### Frontend Files
- `client/src/components/chat-interface.tsx`
- `client/src/pages/agent-chat.tsx`
- `client/src/pages/contacts.tsx`
- Any component displaying messages

### Testing Protocol

#### Manual Testing Steps
1. Delete all messages in test conversation
2. Send 5 messages alternating user/AI
3. Verify messages appear: User1 → AI1 → User2 → AI2 → User3 → AI3
4. Verify newest message at bottom with auto-scroll
5. Verify scrolling up shows older messages

#### Health Check Endpoint
Use `/api/messaging/health-check` to verify message ordering system

### Emergency Procedures

#### If Messages Appear Out of Order
1. **STOP ALL MESSAGING DEVELOPMENT**
2. Check all recent changes to message queries
3. Verify database ordering in all affected queries
4. Test with fresh conversation immediately
5. Document root cause before fix

#### Rollback Procedure
1. Revert all recent messaging-related changes
2. Restart application workflow
3. Test with fresh conversation
4. Only proceed after confirming order is correct

## Smart Scrolling Behavior Standards

**MANDATORY USER EXPERIENCE REQUIREMENTS**: All chat interfaces MUST implement smart scrolling behavior.

### Core Scrolling Requirements:

1. **Initial Chat Load**: 
   - Always scroll to bottom automatically
   - Show latest messages immediately
   - Use smooth scrolling animation

2. **After User Sends Message**:
   - Scroll to show user's question at top of viewport
   - Ensure user can see their question clearly positioned
   - Use 20px padding from container top

3. **After AI Response**:
   - If user hasn't manually scrolled up, show AI response
   - Scroll to bottom to display question + answer together
   - Maintain conversation context visibility

4. **Manual Scrolling Respect**:
   - Track when user manually scrolls up (>50px from bottom)
   - Disable auto-scroll when user is viewing history
   - Re-enable auto-scroll only when user returns near bottom (<100px)
   - Never force scroll when user is reading previous messages

### Implementation Requirements:

- Use `data-message-id` attributes for message targeting
- Implement scroll state tracking with useRef and useState
- Use container.scrollTo() instead of scrollIntoView() to avoid page-level scroll conflicts
- Include scroll-to-top button for long conversations (show when >200px from top)

### Code Implementation Standard

All chat components MUST implement these state variables and effects:
```typescript
const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
const [showScrollTop, setShowScrollTop] = useState(false);
const lastMessageCountRef = useRef(0);
const isInitialLoadRef = useRef(true);
```

### Architecture Principles

#### Single Source of Truth
- Message ordering logic lives in database queries
- Frontend receives messages in correct order
- No frontend sorting/reordering allowed

#### Performance Considerations
- Add indexes on `created_at` columns
- Limit message queries appropriately
- Use pagination for long conversations

#### Memory System Integration
- Personal memories: User-specific, ordered by relevance
- Friends memories: Friend-group specific
- Global memories: Community-wide, upvoted content
- **CRITICAL**: Never mix memory types or ordering systems

## Development Manual Integration

This document is part of the core ShareBrain development manual. ALL developers must:

1. Read this document before any messaging changes
2. Follow the code review checklist
3. Test with the manual testing protocol
4. Update this document if messaging architecture changes

## Contact for Messaging Issues
- Messaging system errors require immediate attention
- Document all issues in replit.md Recent Changes
- Tag messaging fixes as CRITICAL priority

---
**Last Updated**: July 19, 2025
**Version**: 1.0
**Status**: ACTIVE - MANDATORY COMPLIANCE