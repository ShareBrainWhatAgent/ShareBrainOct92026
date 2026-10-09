# AgentForge API v1 Documentation

## Overview

AgentForge provides a RESTful API following OpenAI's patterns for external services to interact with AI agents. The API supports agent creation, management, and completion generation with built-in authentication, rate limiting, and error handling.

## Base URL
```
https://your-domain.replit.app/v1
```

## Authentication

All API requests require authentication using an API key in the Authorization header:

```bash
Authorization: Bearer ak-your-api-key-here
```

**Demo API Key**: `ak-demo123456789` (for testing)

## Rate Limiting

- **Limit**: 100 requests per hour per API key
- **Headers**: Rate limit information included in response headers
- **Error**: Returns `429 Too Many Requests` when exceeded

## Error Handling

All errors follow OpenAI's structured format:

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "param": "parameter_name",
    "code": "error_code"
  }
}
```

### Error Types
- `authentication_error`: Invalid or missing API key
- `validation_error`: Invalid request parameters
- `not_found_error`: Resource not found
- `rate_limit_error`: Rate limit exceeded
- `service_unavailable_error`: AI service temporarily unavailable
- `internal_server_error`: Server error

## Endpoints

### 1. List Agents
Get all available agents.

```bash
GET /v1/agents
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "1",
      "object": "agent",
      "name": "Customer Support Bot",
      "description": "Helpful customer service agent",
      "category": "Customer Support",
      "model": "gpt-4o",
      "created": 1688888888,
      "voice_enabled": true,
      "status": "active"
    }
  ]
}
```

### 2. Get Agent Details
Retrieve detailed information about a specific agent.

```bash
GET /v1/agents/{agent_id}
```

**Response:**
```json
{
  "id": "1",
  "object": "agent",
  "name": "Customer Support Bot",
  "description": "Helpful customer service agent",
  "category": "Customer Support",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 2048,
  "system_prompt": "You are a helpful customer service representative...",
  "voice_enabled": true,
  "voice_type": "alloy",
  "voice_model": "tts-1",
  "status": "active",
  "created": 1688888888
}
```

### 3. Create Agent
Create a new AI agent.

```bash
POST /v1/agents
```

**Request Body:**
```json
{
  "name": "My Custom Agent",
  "description": "A specialized agent for my use case",
  "category": "General",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 2048,
  "system_prompt": "You are a helpful assistant specialized in...",
  "voice_enabled": true,
  "voice_type": "nova",
  "voice_model": "tts-1-hd"
}
```

**Response:** Same format as Get Agent Details with 201 status code.

### 4. Get Agent Completion
Generate a response from an agent (main endpoint for chat functionality).

```bash
POST /v1/agents/{agent_id}/completions
```

**Request Body:**
```json
{
  "input": "Hello, how can you help me?",
  "context": {
    "user_id": "user123",
    "session": "session456",
    "metadata": {
      "source": "web",
      "language": "en"
    }
  },
  "stream": false,
  "temperature": 0.8,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "id": "cmpl-abc123def456",
  "object": "chat.completion",
  "created": 1688888888,
  "model": "gpt-4o",
  "agent_id": "1",
  "agent_name": "Customer Support Bot",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm here to help you with any questions or issues you might have. What can I assist you with today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 43,
    "total_tokens": 68
  },
  "context": {
    "user_id": "user123",
    "session": "session456",
    "metadata": {
      "source": "web",
      "language": "en"
    }
  },
  "response_time_ms": 1250
}
```

### 5. Get Usage Statistics
Check API usage and rate limits.

```bash
GET /v1/usage
```

**Response:**
```json
{
  "object": "usage",
  "api_key": "ak-demo...",
  "requests_used": 15,
  "requests_limit": 100,
  "reset_time": 1688892488,
  "period": "hour"
}
```

### 6. Get Conversation Messages
Retrieve the message history for a specific conversation.

```bash
GET /v1/conversations/{conversation_id}/messages
```

**Response:**
```json
{
  "object": "list",
  "data": [
    { "id": "1", "role": "user", "content": "Hello", "created_at": 1688888888 },
    { "id": "2", "role": "assistant", "content": "Hi there!", "created_at": 1688888890 }
  ]
}
```

## Request Parameters

### Agent Creation Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Agent display name |
| `description` | string | No | "" | Agent description |
| `category` | string | No | "General" | Agent category |
| `model` | string | No | "gpt-4o" | AI model to use |
| `temperature` | number | No | 0.7 | Response creativity (0-2) |
| `max_tokens` | number | No | 2048 | Maximum response length |
| `system_prompt` | string | No | "" | Agent behavior instructions |
| `voice_enabled` | boolean | No | false | Enable text-to-speech |
| `voice_type` | string | No | "alloy" | Voice type (alloy, echo, fable, onyx, nova, shimmer) |
| `voice_model` | string | No | "tts-1" | Voice model (tts-1, tts-1-hd) |

### Completion Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `input` | string | Yes | - | User message to send to agent |
| `context` | object | No | {} | Additional context information |
| `stream` | boolean | No | false | Enable streaming responses |
| `temperature` | number | No | agent default | Override agent temperature |
| `max_tokens` | number | No | agent default | Override agent max tokens |

## Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://your-domain.replit.app/v1',
  headers: {
    'Authorization': 'Bearer ak-demo123456789',
    'Content-Type': 'application/json'
  }
});

// Get agent completion
async function chatWithAgent(agentId, message) {
  try {
    const response = await client.post(`/agents/${agentId}/completions`, {
      input: message,
      context: { user_id: 'user123' }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('API Error:', error.response.data);
  }
}

// Usage
chatWithAgent('1', 'Hello!').then(response => {
  console.log('Agent response:', response);
});
```

### Python
```python
import requests

class ShareBrainClient:
    def __init__(self, api_key, base_url):
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
        self.base_url = base_url

    def chat_with_agent(self, agent_id, message, context=None):
        response = self.session.post(
            f'{self.base_url}/agents/{agent_id}/completions',
            json={
                'input': message,
                'context': context or {}
            }
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

# Usage
client = ShareBrainClient('ak-demo123456789', 'https://your-domain.replit.app/v1')
response = client.chat_with_agent('1', 'Hello!')
print(f'Agent response: {response}')
```

### cURL
```bash
# Get all agents
curl -X GET "https://your-domain.replit.app/v1/agents" \
  -H "Authorization: Bearer ak-demo123456789"

# Chat with an agent
curl -X POST "https://your-domain.replit.app/v1/agents/1/completions" \
  -H "Authorization: Bearer ak-demo123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello, how can you help me?",
    "context": {
      "user_id": "user123",
      "session": "session456"
    }
  }'

# Create a new agent
curl -X POST "https://your-domain.replit.app/v1/agents" \
  -H "Authorization: Bearer ak-demo123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Support Agent",
    "description": "Specialized customer support",
    "system_prompt": "You are a helpful customer service representative...",
    "voice_enabled": true,
    "voice_type": "nova"
  }'
```

## Integration Patterns

### Webhook Integration
Use the API to create agents that respond to webhook events:

```javascript
app.post('/webhook', async (req, res) => {
  const { message, user_id } = req.body;
  
  const response = await client.post('/agents/1/completions', {
    input: message,
    context: { user_id, source: 'webhook' }
  });
  
  // Send response back to external service
  res.json({ reply: response.data.choices[0].message.content });
});
```

### Chatbot Framework Integration
Integrate with popular chatbot frameworks:

```javascript
// Example with a generic chatbot framework
bot.on('message', async (message) => {
  const response = await client.post(`/agents/${AGENT_ID}/completions`, {
    input: message.text,
    context: {
      user_id: message.user.id,
      channel: message.channel
    }
  });
  
  bot.reply(message, response.data.choices[0].message.content);
});
```

## Best Practices

1. **Error Handling**: Always handle API errors gracefully
2. **Rate Limiting**: Implement exponential backoff for rate limit errors
3. **Context Management**: Use the context parameter to maintain conversation state
4. **API Key Security**: Never expose API keys in client-side code
5. **Caching**: Cache agent configurations to reduce API calls
6. **Monitoring**: Track usage statistics and response times

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your API key format (must start with "ak-")
2. **429 Rate Limit**: Wait for rate limit reset or implement backoff
3. **404 Agent Not Found**: Verify agent ID exists using list agents endpoint
4. **503 Service Unavailable**: AI service is temporarily down, retry later

### Debug Mode
Add debug headers to your requests for additional error information:

```bash
curl -H "X-Debug: true" ...
```

This API enables seamless integration of AgentForge's AI agents into any external service or application.