# ShareBrain Discord Bot

A unified Discord bot that provides access to all ShareBrain AI agents directly from Discord servers.

## Features

- **180+ AI Agents**: Access all ShareBrain agents in one Discord bot
- **Dynamic Agent Switching**: Switch between agents mid-conversation
- **Slash Commands**: Modern Discord command interface
- **Rich Embeds**: Beautiful formatted responses with agent branding
- **User Preferences**: Remember favorite agents per user
- **Search & Discovery**: Find agents by name or category
- **Direct Messages**: Chat with agents via DM

## Commands

### Chat Commands
- `/chat message:"your message"` - Chat with your current default agent
- `/chat message:"hello" agent:"agent name"` - Chat with a specific agent
- `@ShareBrain your message` - Direct message the bot

### Agent Management
- `/agents` - List all available agents
- `/agents search:"keyword"` - Search agents by name or category
- `/switch agent:"agent name"` - Set a new default agent
- `/current` - Show your current active agent
- `/help` - Show bot help information

## Setup

### Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token
- ShareBrain API Key

### Installation

1. Clone or download the bot files
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   SHAREBRAIN_API_BASE_URL=https://your-sharebrain-domain.com
   SHAREBRAIN_API_KEY=your_sharebrain_api_key_here
   ```

4. Run the bot:
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

### Discord Bot Setup

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to your `.env` file
5. Under "OAuth2" > "URL Generator":
   - Select "bot" and "applications.commands" scopes
   - Select required permissions (Send Messages, Use Slash Commands, etc.)
   - Use the generated URL to invite the bot to your server

### ShareBrain API Setup

1. Get your ShareBrain API key from the ShareBrain platform
2. Ensure your API key has access to the agents you want to make available
3. Update the `SHAREBRAIN_API_BASE_URL` to match your ShareBrain instance

## Usage Examples

### Basic Chat
```
/chat message:"Hello, how are you?"
```

### Chat with Specific Agent
```
/chat message:"Plan a trip to Japan" agent:"Travel Assistant"
```

### Switch Default Agent
```
/switch agent:"Marketing Expert"
```

### Find Agents
```
/agents search:"language"
```

## Architecture

The bot uses a unified architecture where:

- **Single Bot Instance**: One Discord bot handles all agents
- **Dynamic Routing**: Messages are routed to appropriate ShareBrain agents
- **Session Management**: Tracks user preferences and current agents
- **API Integration**: Leverages existing ShareBrain API infrastructure
- **Caching**: Caches agent information for performance

## Agent Features

Each ShareBrain agent accessed through Discord maintains:
- **Individual Personality**: Unique system prompts and behaviors
- **Specialized Knowledge**: Domain-specific expertise
- **Consistent Branding**: Agent name, avatar, and category display
- **Memory System**: Personal, friends, and global memory (if enabled)
- **Voice & Image Support**: TTS and image generation capabilities

## Error Handling

The bot includes comprehensive error handling:
- API connection failures
- Invalid agent requests
- Rate limiting protection
- Graceful degradation

## Development

### Project Structure
```
discord-bot/
├── index.js          # Main bot implementation
├── package.json      # Dependencies and scripts
├── .env.example      # Environment configuration template
└── README.md         # This file
```

### Adding Features

To extend the bot:
1. Add new slash commands in `setupCommands()`
2. Handle commands in `handleCommand()`
3. Implement API calls to ShareBrain
4. Create rich Discord embeds for responses

### API Integration

The bot integrates with ShareBrain's existing API:
- `GET /api/v1/agents` - List available agents
- `GET /api/v1/agents/:id` - Get agent details
- `POST /api/v1/agents/:id/completions` - Chat with agent

## Security

- API keys are stored securely in environment variables
- Rate limiting prevents abuse
- User permissions are handled by Discord
- No sensitive data is logged

## Support

For issues or questions:
1. Check the ShareBrain API documentation
2. Verify your API key has proper permissions
3. Ensure Discord bot permissions are correct
4. Review console logs for error details

## License

MIT License - See LICENSE file for details