# Invite Brain System API Documentation

## Overview

The Invite Brain System provides comprehensive API endpoints for creating and managing exclusive member-only AI brains with role-based access control. This system supports both private invite-only brains and public brains that users can request to join.

## Authentication

All API endpoints require authentication using the existing `isAuthenticated` middleware. Users must be logged in to access any invite brain functionality.

## API Endpoints

### 1. Brain Management

#### Create Invite Brain
```
POST /api/invite-brains
```

Creates a new invite brain from an existing agent.

**Request Body:**
```json
{
  "agentId": 123,
  "brainType": "private_invite" | "public_invite",
  "accessModel": "invite_only" | "request_to_join" | "paid_access",
  "price": 9.99,
  "maxMembers": 50,
  "description": "Exclusive brain for advanced discussions"
}
```

**Response:**
```json
{
  "inviteBrain": { ... },
  "message": "Invite brain created successfully"
}
```

#### Get User's Invite Brains
```
GET /api/invite-brains
```

Returns all invite brains created by the authenticated user.

**Response:**
```json
{
  "inviteBrains": [...],
  "count": 3
}
```

#### Get Public Invite Brains
```
GET /api/invite-brains/public
```

Returns all public invite brains available for joining.

**Response:**
```json
{
  "inviteBrains": [...],
  "count": 15
}
```

#### Get Invite Brain Details
```
GET /api/invite-brains/:id
```

Returns detailed information about a specific invite brain.

**Response:**
```json
{
  "inviteBrain": { ... },
  "members": [...],
  "memoryStats": { ... },
  "userMembership": { ... }
}
```

#### Update Invite Brain Settings
```
PUT /api/invite-brains/:id
```

Updates invite brain settings (creator only).

**Request Body:**
```json
{
  "accessModel": "request_to_join",
  "price": 19.99,
  "maxMembers": 100,
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Invite Brain
```
DELETE /api/invite-brains/:id
```

Deletes an invite brain (creator only).

### 2. Membership Management

#### Get User's Memberships
```
GET /api/invite-brains/memberships
```

Returns all invite brains the user is a member of.

**Response:**
```json
{
  "memberships": [...],
  "count": 5
}
```

#### Manage Brain Members
```
POST /api/invite-brains/:id/members/:userId
```

Manage brain members (creator only).

**Request Body:**
```json
{
  "action": "update_role" | "remove" | "activate" | "deactivate",
  "role": "contributor" | "viewer"
}
```

### 3. Invitation System

#### Send Invitations
```
POST /api/invite-brains/:id/invite
```

Send invitations to users (creator only).

**Request Body:**
```json
{
  "userIds": ["user1", "user2"],
  "userHandles": ["alice", "bob"],
  "role": "contributor" | "viewer",
  "message": "Welcome to our exclusive brain!"
}
```

**Response:**
```json
{
  "invitations": [...],
  "errors": [...],
  "message": "Sent 2 invitations with 0 errors"
}
```

#### Get Pending Invitations
```
GET /api/invite-brains/invitations/pending
```

Returns pending invitations for the user.

**Response:**
```json
{
  "invitations": [...],
  "count": 2
}
```

#### Respond to Invitation
```
POST /api/invite-brains/invitations/:id/respond
```

Accept or decline an invitation.

**Request Body:**
```json
{
  "response": "accepted" | "declined"
}
```

#### Request to Join Public Brain
```
POST /api/invite-brains/:id/join
```

Request to join a public invite brain.

**Request Body:**
```json
{
  "message": "I'd like to join this brain"
}
```

### 4. Memory System

#### Add Memory
```
POST /api/invite-brains/:id/memories
```

Add a memory to the invite brain (creator/contributor only).

**Request Body:**
```json
{
  "message": "We discussed advanced AI techniques and agreed on best practices"
}
```

**Response:**
```json
{
  "memory": { ... },
  "message": "Memory added successfully",
  "analysis": { ... }
}
```

#### Get Memories
```
GET /api/invite-brains/:id/memories
```

Retrieve all memories for an invite brain.

**Response:**
```json
{
  "memories": [...],
  "stats": { ... },
  "count": 25
}
```

### 5. Analytics & Monitoring

#### Get Analytics
```
GET /api/invite-brains/:id/analytics
```

Get comprehensive analytics for the brain (creator only).

**Response:**
```json
{
  "totalMembers": 15,
  "activeMembers": 12,
  "totalMemories": 45,
  "totalInvitations": 25,
  "pendingInvitations": 3,
  "membersByRole": {
    "creators": 1,
    "contributors": 8,
    "viewers": 6
  },
  "memoriesByCategory": {
    "technical_discussion": 12,
    "project_planning": 8,
    "general_knowledge": 25
  },
  "recentActivity": {
    "newMembersThisWeek": 2,
    "newMemoriesThisWeek": 7
  }
}
```

#### Health Check
```
GET /api/invite-brains/health-check
```

System health check and endpoint listing.

**Response:**
```json
{
  "status": "healthy",
  "phase": "Phase 2: API Routes & Business Logic",
  "tests": {
    "invitebrainsTable": true,
    "brainMembershipsTable": true,
    "brainInvitationsTable": true,
    "inviteBrainMemoriesTable": true,
    "storageMethodsAvailable": true
  },
  "timestamp": "2025-07-20T15:05:00.000Z",
  "totalEndpoints": 16,
  "availableEndpoints": [...]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include descriptive messages:

```json
{
  "message": "Access denied: Only creators can send invitations"
}
```

## Role-Based Access Control

### Creator
- Full control over the invite brain
- Can invite/remove members
- Can update brain settings
- Can view analytics
- Can delete the brain

### Contributor
- Can add memories
- Can view all memories
- Can participate in conversations

### Viewer
- Can view memories (read-only)
- Can participate in conversations
- Cannot add new memories

## Memory System Integration

The invite brain memory system uses AI-powered analysis to classify and store meaningful information from conversations. Memories are:

- **Automatically Classified**: Using Llama 3.1 70B for intelligent categorization
- **Contributor Tracked**: Each memory records who contributed it
- **Role-Based**: Contributors can add memories, viewers can only read
- **Searchable**: Memories can be retrieved by category or content

## Next Steps: Phase 3 Frontend Implementation

With Phase 2 complete, the system is ready for Phase 3: Frontend Implementation, which will include:

1. **Invite Brain Creation UI**: Forms for creating and configuring invite brains
2. **Brain Directory**: Browse and join public invite brains
3. **Dashboard**: Manage your invite brains and memberships
4. **Invitation Management**: Send/receive invitations interface
5. **Memory Interface**: Add and browse brain memories
6. **Analytics Dashboard**: View brain statistics and activity