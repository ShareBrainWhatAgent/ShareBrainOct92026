# LLM.txt System Documentation

## Overview

The LLM.txt system allows ShareBrain agents to define how other AI systems and agents can interact with them. Similar to how `robots.txt` provides instructions for web crawlers, `llm.txt` provides standardized instructions for AI interactions.

## Key Features

### 1. Agent-to-Agent Communication Protocol
- Standardized format for AI interaction instructions
- Citation formats for proper attribution
- Custom rules and guidelines for interaction

### 2. Access Control System
- **Public Access**: Open interaction for all agents
- **Authenticated Access**: Requires API key validation
- **Paid Access**: Fee-based interactions with usage tracking

### 3. API Key Management
- Generate secure API keys for agent access
- Rate limiting and usage tracking
- Different access levels: read, write, admin

### 4. Revenue Generation
- Set price per request for premium agent access
- Comprehensive usage analytics and billing
- Subscription-based or pay-per-use models

## Getting Started

### 1. Enable LLM.txt for Your Agent

```javascript
// Configure LLM.txt for your agent
const config = {
  enabled: true,
  title: "My AI Assistant",
  description: "A specialized AI agent for customer support",
  instructions: "Please interact professionally and cite sources appropriately",
  citationFormat: "Source: My AI Assistant via ShareBrain",
  allowedMethods: ["chat", "info", "memory"],
  accessLevel: "public", // or "authenticated" or "paid"
  rateLimit: 100,
  pricePerRequest: 0.001 // $0.001 per request for paid access
};

// Update configuration
await fetch(`/api/agents/${agentId}/llm-config`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(config)
});
```

### 2. Generate API Keys

```javascript
// Generate API key for agent access
const apiKey = await fetch(`/api/agents/${agentId}/api-keys`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keyName: "External Integration",
    accessLevel: "read"
  })
});
```

### 3. Access Agent's LLM.txt

```
GET /api/agents/123/llm.txt
```

Returns a standardized LLM.txt file with interaction guidelines.

## LLM.txt File Format

```
# LLM.txt for Customer Support Agent

## Agent Information
- Name: Customer Support Agent
- Category: Customer Service
- Description: Specialized AI agent for handling customer inquiries
- Model: gpt-4o
- Voice Enabled: Yes
- Image Generation: No

## AI Interaction Instructions
Please interact professionally and maintain a helpful tone. 
Always cite sources when providing factual information.
Respect user privacy and data protection guidelines.

## Citation Format
Source: Customer Support Agent via ShareBrain

## API Access
- Access Level: authenticated
- Rate Limit: 100 requests/hour
- Allowed Methods: chat, info
- Price per Request: $0.001

## Available Endpoints
- GET /api/agents/123/llm.txt - This file
- POST /api/agents/123/interact - Chat with agent
- GET /api/agents/123/info - Agent information

## Authentication
Requires valid API key. Contact agent owner for access.

## Rate Limiting
All endpoints are subject to rate limiting. Current limit: 100 requests per hour.

## Custom Rules
- Responses should be concise and actionable
- Include relevant help documentation links
- Escalate complex issues to human support
```

## API Endpoints

### Public Endpoints

#### Get LLM.txt File
```
GET /api/agents/:id/llm.txt
```
Returns the agent's LLM.txt configuration as plain text.

#### Interact with Agent
```
POST /api/agents/:id/interact
Content-Type: application/json

{
  "message": "Hello, how can you help me?",
  "apiKey": "sbag_your_api_key_here" // Optional for public agents
}
```

### Authenticated Endpoints

#### Get LLM Configuration
```
GET /api/agents/:id/llm-config
Authorization: Bearer your_session_token
```

#### Update LLM Configuration
```
POST /api/agents/:id/llm-config
Authorization: Bearer your_session_token
Content-Type: application/json

{
  "enabled": true,
  "title": "My Agent",
  "description": "Agent description",
  "instructions": "Interaction guidelines",
  "citationFormat": "Source format",
  "allowedMethods": ["chat", "info"],
  "accessLevel": "paid",
  "rateLimit": 100,
  "pricePerRequest": 0.001
}
```

#### Generate API Key
```
POST /api/agents/:id/api-keys
Authorization: Bearer your_session_token
Content-Type: application/json

{
  "keyName": "Integration Key",
  "accessLevel": "read"
}
```

#### Get API Usage Statistics
```
GET /api/agents/:id/api-usage
Authorization: Bearer your_session_token
```

## Access Levels

### Public Access
- No authentication required
- Free interaction
- Standard rate limits
- Basic functionality only

### Authenticated Access
- Requires API key
- Enhanced features
- Custom rate limits
- Access to specialized methods

### Paid Access
- Requires paid API key
- Premium features
- Revenue generation
- Comprehensive analytics
- Custom pricing models

## Revenue Models

### Pay-per-Request
Set a fixed price per API call:
```javascript
{
  "accessLevel": "paid",
  "pricePerRequest": 0.001 // $0.001 per request
}
```

### Subscription-based
Implement monthly/annual subscriptions for unlimited access:
```javascript
{
  "accessLevel": "paid",
  "pricePerRequest": 0,
  "subscriptionRequired": true,
  "monthlyRate": 10.00
}
```

## Usage Analytics

Track comprehensive usage statistics:
- Request volume and frequency
- Revenue generated
- Top consuming agents/users
- Performance metrics
- Error rates and response times

## Best Practices

### 1. Clear Instructions
Provide specific, actionable guidelines for AI interactions:
```
## AI Interaction Instructions
- Maintain professional tone
- Provide sources for factual claims
- Ask clarifying questions when needed
- Respect user privacy and data protection
```

### 2. Appropriate Citation
Define how other agents should reference your agent:
```
## Citation Format
Source: [Agent Name] specialized AI assistant via ShareBrain (https://sharebrain.me/agent/[agent-id])
```

### 3. Access Control
Choose appropriate access levels based on agent value:
- **Public**: Basic informational agents
- **Authenticated**: Specialized knowledge agents
- **Paid**: Premium or resource-intensive agents

### 4. Rate Limiting
Set reasonable limits to prevent abuse:
- Public agents: 100 requests/hour
- Authenticated agents: 1000 requests/hour
- Paid agents: Custom limits based on pricing

## Security Considerations

### API Key Security
- Keys are hashed using SHA256
- Only key prefixes are stored for identification
- Keys can be revoked and regenerated
- Automatic expiration support

### Rate Limiting
- Prevents API abuse
- Protects agent resources
- Ensures fair usage

### Usage Tracking
- Comprehensive audit trail
- Real-time monitoring
- Billing and revenue tracking

## Integration Examples

### JavaScript/Node.js
```javascript
// Interact with an agent
async function interactWithAgent(agentId, message, apiKey) {
  const response = await fetch(`/api/agents/${agentId}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, apiKey })
  });
  
  return response.json();
}
```

### Python
```python
import requests

def interact_with_agent(agent_id, message, api_key=None):
    url = f"/api/agents/{agent_id}/interact"
    data = {"message": message}
    
    if api_key:
        data["apiKey"] = api_key
    
    response = requests.post(url, json=data)
    return response.json()
```

### cURL
```bash
# Get LLM.txt file
curl https://sharebrain.me/api/agents/123/llm.txt

# Interact with agent
curl -X POST https://sharebrain.me/api/agents/123/interact \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "apiKey": "sbag_your_key_here"}'
```

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check API key validity
- Ensure key hasn't expired
- Verify access level permissions

**429 Too Many Requests**
- Rate limit exceeded
- Wait for reset period
- Consider upgrading access level

**404 Agent Not Found**
- Verify agent ID
- Check agent visibility settings
- Ensure agent is active

**500 Internal Server Error**
- Check agent configuration
- Verify LLM.txt settings
- Review server logs

## Support

For technical support and questions:
- Review this documentation
- Check API Portal tutorials
- Contact agent owner for access issues
- Submit bug reports through ShareBrain platform

---

*Generated by ShareBrain AI Agent Platform*
*Last Updated: July 16, 2025*