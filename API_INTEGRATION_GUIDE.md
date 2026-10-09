# AgentForge API Integration Guide for Messenger Apps

## Overview
This guide shows how to integrate your messenger application with AgentForge agents using our REST API.

## Prerequisites
1. **API Key**: Get your API key from the AgentForge API Portal (`/api-portal`)
   - Login with: `developer@example.com` / `demo123`
   - Copy your API key (starts with `ak-`)

2. **Agent ID**: Find the agent you want to use
   - List your agents via API or dashboard
   - Note the agent ID number

## Base URL
```
https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1
```

## Authentication
All API calls require a Bearer token in the Authorization header:
```
Authorization: Bearer ak-your-api-key-here
```

## Step-by-Step Integration

### 1. List Available Agents
First, get a list of your available agents:

```bash
curl -H "Authorization: Bearer ak-demo123456789" \
     https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1/agents
```

**Response:**
```json
[
  {
    "id": 12,
    "name": "Spanish Language Tutor",
    "description": "Great Spanish Language Teacher for Beginners",
    "category": "Research Helper",
    "systemPrompt": "You are a great Spanish teacher...",
    "voiceEnabled": false,
    "status": "active"
  }
]
```

### 2. Send Messages to Agent
Use the completions endpoint to chat with an agent:

```bash
curl -X POST \
     -H "Authorization: Bearer ak-demo123456789" \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {"role": "user", "content": "Hello, I want to learn Spanish greetings"}
       ],
       "max_tokens": 150,
       "temperature": 0.7
     }' \
     https://e7c6e448-66c3-4bda-9bc5-828881f0c8ab-00-2k3x8pwqi53k3.riker.replit.dev/api/v1/agents/17/completions
```

**Response:**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "¡Hola! I'd be happy to teach you Spanish greetings. Here are some common ones:\n\n1. Hola - Hello (informal)\n2. Buenos días - Good morning\n3. Buenas tardes - Good afternoon..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 87,
    "total_tokens": 132
  }
}
```

## Code Examples for Different Platforms

### JavaScript/Node.js Messenger Bot

```javascript
const axios = require('axios');

class ShareBrainClient {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async sendMessage(agentId, message, conversationHistory = []) {
    try {
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        `${this.baseUrl}/agents/${agentId}/completions`,
        {
          messages: messages,
          max_tokens: 150,
          temperature: 0.7
        },
        { headers: this.headers }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('ShareBrain API Error:', error.response?.data);
      throw error;
    }
  }

  async getAgents() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/agents`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch agents:', error.response?.data);
      throw error;
    }
  }
}

// Usage Example
const client = new ShareBrainClient(
  'ak-demo123456789',
  'https://sharebrain.me/api/v1'
);

// In your messenger bot handler
async function handleMessage(userMessage, conversationHistory = []) {
  try {
    const agentId = 17; // Your Spanish tutor agent
    const response = await client.sendMessage(agentId, userMessage, conversationHistory);
    
    // Send response back to user through your messenger platform
    return response;
  } catch (error) {
    return "Sorry, I'm having trouble connecting to the AI agent right now.";
  }
}
```

### Python Messenger Bot

```python
import requests
import json

class ShareBrainClient:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, agent_id, message, conversation_history=None):
        if conversation_history is None:
            conversation_history = []
        
        messages = conversation_history + [
            {'role': 'user', 'content': message}
        ]
        
        data = {
            'messages': messages,
            'max_tokens': 150,
            'temperature': 0.7
        }
        
        response = requests.post(
            f'{self.base_url}/agents/{agent_id}/completions',
            headers=self.headers,
            json=data
        )
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        else:
            raise Exception(f"API Error: {response.status_code} - {response.text}")
    
    def get_agents(self):
        response = requests.get(
            f'{self.base_url}/agents',
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API Error: {response.status_code} - {response.text}")

# Usage Example
client = ShareBrainClient(
    'ak-demo123456789',
    'https://sharebrain.me/api/v1'
)

def handle_message(user_message, conversation_history=None):
    try:
        agent_id = 12  # Your Spanish tutor agent
        response = client.send_message(agent_id, user_message, conversation_history)
        return response
    except Exception as e:
        print(f"Error: {e}")
        return "Sorry, I'm having trouble connecting to the AI agent right now."
```

### Discord Bot Example

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const ShareBrainClient = require('./sharebrain-client'); // Your client from above

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const shareBrain = new ShareBrainClient(
  'ak-demo123456789',
  'https://sharebrain.me/api/v1'
);

// Store conversation history per user/channel
const conversations = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Check if message starts with bot prefix
  if (!message.content.startsWith('!agent')) return;
  
  const userMessage = message.content.slice(6).trim(); // Remove "!agent"
  const channelId = message.channel.id;
  
  // Get or create conversation history
  if (!conversations.has(channelId)) {
    conversations.set(channelId, []);
  }
  const history = conversations.get(channelId);
  
  try {
    const agentId = 17; // Your Spanish teacher agent
    const response = await shareBrain.sendMessage(agentId, userMessage, history);
    
    // Update conversation history
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response }
    );
    
    // Keep only last 10 exchanges to manage token limits
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    await message.reply(response);
  } catch (error) {
    console.error('Agent error:', error);
    await message.reply('Sorry, I encountered an error. Please try again.');
  }
});

client.login('YOUR_DISCORD_BOT_TOKEN');
```

## Key Integration Points

### 1. Conversation Memory
- Store conversation history in your app's memory/database
- Send recent messages as context for natural conversations
- Limit history to manage token costs (last 10-20 exchanges)

### 2. Error Handling
- Handle API rate limits (429 status)
- Manage authentication errors (401 status)  
- Provide fallback responses for service downtime

### 3. Agent Selection
- Allow users to choose different agents
- Store user preferences for default agents
- Switch agents based on conversation context

### 4. Response Optimization
- Adjust `max_tokens` based on your platform's limits
- Use `temperature` to control response creativity (0.7 is good default)
- Consider streaming for long responses (if your platform supports it)

## Rate Limits
- **100 requests per hour** per API key
- Monitor usage via `/api/v1/usage` endpoint
- Implement backoff strategies for rate limit handling

## Testing Your Integration
1. Start with simple "hello" messages
2. Test conversation memory with follow-up questions
3. Verify error handling with invalid requests
4. Test different agents and their personalities

## Support
- Check API status at `/api/v1/agents` endpoint
- Review logs for authentication issues
- Ensure your Replit domain is correctly configured

Your AgentForge agents will maintain their configured personalities, system prompts, and specialized knowledge when accessed through the API, providing consistent AI interactions across all your messenger platforms.