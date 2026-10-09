# Invite Brain System Documentation

## Overview

The Invite Brain System is a comprehensive feature that allows users to create exclusive, member-only AI brains with controlled access, role-based permissions, and shared memory systems. This system extends ShareBrain's core functionality to support private communities and collaborative AI experiences.

## System Architecture

### Database Schema

The Invite Brain System uses five core tables:

1. **invite_brains** - Core brain configurations
2. **brain_memberships** - User membership and roles
3. **brain_invitations** - Invitation management
4. **invite_brain_memories** - Isolated memory storage
5. **brain_payments** - Payment tracking (future feature)

### Memory Isolation

The system maintains complete memory isolation:
- **Personal Memories**: Private to individual users
- **Friends Memories**: Shared among friend groups
- **Global Memories**: Public shared memories
- **Invite Brain Memories**: Exclusive to brain members (NEW)

## Core Features

### 1. Brain Types

**Private Invite Brains**
- Invitation-only access
- Creator controls all invitations
- Maximum privacy and exclusivity

**Public Invite Brains**
- Listed in public directory
- Users can request to join
- Optional paid access model

### 2. Access Models

**Invite Only**
- Creator sends direct invitations
- No public visibility
- Maximum control over membership

**Request to Join**
- Users can request membership
- Creator approves/denies requests
- Semi-public discovery

**Paid Access**
- Monetized brain access
- Stripe integration ready
- Automated payment processing

### 3. Role-Based Access Control

**Creator**
- Full administrative control
- Manage members and settings
- Access to analytics dashboard
- Can add/remove memories

**Contributor**
- Can add memories to brain
- Participate in conversations
- View all brain content
- Cannot manage members

**Viewer**
- Read-only access to memories
- Participate in conversations
- Cannot add memories
- Cannot manage members

### 4. Memory System

**AI-Powered Classification**
- Automatic memory categorization
- Intelligent memory detection
- Context-aware storage

**Categories Include:**
- restaurant_recommendation
- travel_experience
- work_information
- personal_preferences
- important_dates
- hobbies_interests
- family_information
- health_information
- location_preferences
- dietary_preferences

## API Endpoints

### Brain Management
- `GET /api/invite-brains` - List user's brains
- `POST /api/invite-brains` - Create new brain
- `GET /api/invite-brains/:id` - Get brain details
- `PUT /api/invite-brains/:id` - Update brain
- `DELETE /api/invite-brains/:id` - Delete brain

### Membership System
- `GET /api/invite-brains/memberships` - User's memberships
- `POST /api/invite-brains/:id/members` - Add member
- `PUT /api/invite-brains/:id/members/:userId` - Update member role
- `DELETE /api/invite-brains/:id/members/:userId` - Remove member

### Invitation System
- `POST /api/invite-brains/:id/invite` - Send invitations
- `GET /api/invite-brains/invitations/pending` - Pending invitations
- `POST /api/invite-brains/invitations/:id/respond` - Respond to invitation

### Memory Integration
- `GET /api/invite-brains/:id/memories` - Get brain memories
- `POST /api/invite-brains/:id/memories` - Add memory
- `DELETE /api/invite-brains/:id/memories/:memoryId` - Remove memory

### Analytics & Monitoring
- `GET /api/invite-brains/:id/analytics` - Brain analytics
- `GET /api/invite-brains/public` - Public brain directory
- `GET /api/invite-brains/health-check` - System health

## Frontend Components

### InviteBrains Dashboard
Main management interface with three tabs:
- **My Brains**: Created brains with management controls
- **Memberships**: Brains the user has joined
- **Public Directory**: Discoverable public brains

### BrainInvitations Manager
Invitation workflow management:
- Send bulk invitations by username
- Respond to received invitations
- Track invitation status and history

### InviteBrainDetail Modal
Comprehensive brain interface:
- **Overview**: Brain information and statistics
- **Memories**: View and add brain memories
- **Members**: Member list with role management
- **Analytics**: Creator-only analytics dashboard

## Integration Points

### Authentication
- Seamless integration with existing Google OAuth
- User identification via Replit Auth
- Role-based API endpoint protection

### Memory Service
- Extends existing intelligentMemoryService
- Maintains isolation from other memory types
- AI-powered memory classification

### Agent System
- Transform existing agents into invite brains
- Preserve agent functionality and configuration
- Maintain agent chat capabilities

## Development Guidelines

### Zero-Breakage Approach
- All existing functionality remains intact
- Additive-only implementation
- Complete system isolation

### Security Considerations
- Role-based access validation
- Proper authentication on all endpoints
- Memory isolation enforcement

### Error Handling
- Comprehensive error messages
- Graceful degradation
- User-friendly feedback

## Usage Examples

### Creating an Invite Brain
```javascript
const brainData = {
  agentId: 123,
  brainType: 'private_invite',
  accessModel: 'invite_only',
  description: 'Exclusive marketing strategy brain',
  maxMembers: 10
};
```

### Sending Invitations
```javascript
const inviteData = {
  brainId: 456,
  userHandles: ['user1', 'user2', 'user3'],
  role: 'contributor',
  message: 'Welcome to our exclusive brain!'
};
```

### Adding Memories
```javascript
const memoryData = {
  message: 'Our Q4 marketing strategy focuses on social media engagement'
};
```

## Future Enhancements

### Planned Features
- Payment processing integration
- Advanced analytics dashboard
- Bulk member management
- Memory search and filtering
- Export/import capabilities

### Scalability Considerations
- Optimized database queries
- Caching strategies
- Performance monitoring
- Load balancing ready

## Support and Troubleshooting

### Common Issues
- Authentication failures: Check user session
- Permission errors: Verify user role
- Memory isolation: Confirm brain membership

### Debugging Tools
- Health check endpoint
- Comprehensive logging
- Error tracking
- Performance metrics

This documentation provides a complete reference for the Invite Brain System, enabling developers to understand, implement, and extend the functionality while maintaining system integrity and user experience.