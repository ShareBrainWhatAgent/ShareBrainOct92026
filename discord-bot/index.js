const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

class ShareBrainDiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.apiBaseUrl = process.env.SHAREBRAIN_API_BASE_URL || 'https://sharebrain.me';
    this.apiKey = process.env.SHAREBRAIN_API_KEY;
    this.defaultAgentId = process.env.DEFAULT_AGENT_ID || 1;
    this.maxMessageLength = process.env.MAX_MESSAGE_LENGTH || 2000;
    
    // Store user/channel agent preferences
    this.userAgents = new Map(); // userId -> agentId
    this.channelAgents = new Map(); // channelId -> agentId
    this.agentCache = new Map(); // agentId -> agent data
    
    this.setupCommands();
    this.setupEventHandlers();
  }

  async setupCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Chat with a ShareBrain AI agent')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Your message to the agent')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('agent')
            .setDescription('Agent name or ID (optional)')
            .setRequired(false)
        ),
      
      new SlashCommandBuilder()
        .setName('agents')
        .setDescription('List available ShareBrain agents')
        .addStringOption(option =>
          option.setName('search')
            .setDescription('Search agents by name or category')
            .setRequired(false)
        ),
      
      new SlashCommandBuilder()
        .setName('switch')
        .setDescription('Switch to a different default agent')
        .addStringOption(option =>
          option.setName('agent')
            .setDescription('Agent name or ID')
            .setRequired(true)
        ),
      
      new SlashCommandBuilder()
        .setName('current')
        .setDescription('Show current active agent'),
      
      new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show ShareBrain Discord Bot help')
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    
    try {
      console.log('Registering slash commands...');
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      console.log('Slash commands registered successfully!');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`ShareBrain Discord Bot is online as ${this.client.user.tag}!`);
      this.client.user.setActivity('with ShareBrain AI agents', { type: 'PLAYING' });
      this.loadAgentCache();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      try {
        await this.handleCommand(interaction);
      } catch (error) {
        console.error('Error handling command:', error);
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Error')
          .setDescription('An error occurred while processing your request. Please try again.')
          .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    });

    // Handle direct messages to bot
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      // Only respond to DMs or mentions
      if (message.channel.type === 'DM' || message.mentions.has(this.client.user)) {
        const content = message.content.replace(`<@${this.client.user.id}>`, '').trim();
        if (content) {
          await this.handleDirectMessage(message, content);
        }
      }
    });
  }

  async handleCommand(interaction) {
    const { commandName } = interaction;

    switch (commandName) {
      case 'chat':
        await this.handleChatCommand(interaction);
        break;
      case 'agents':
        await this.handleAgentsCommand(interaction);
        break;
      case 'switch':
        await this.handleSwitchCommand(interaction);
        break;
      case 'current':
        await this.handleCurrentCommand(interaction);
        break;
      case 'help':
        await this.handleHelpCommand(interaction);
        break;
    }
  }

  async handleChatCommand(interaction) {
    await interaction.deferReply();
    
    const message = interaction.options.getString('message');
    const agentParam = interaction.options.getString('agent');
    
    // Determine which agent to use
    let agentId = this.getCurrentAgentId(interaction.user.id, interaction.channel.id);
    
    if (agentParam) {
      const agent = await this.findAgent(agentParam);
      if (agent) {
        agentId = agent.id;
      } else {
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Agent Not Found')
          .setDescription(`Could not find agent: "${agentParam}". Use \`/agents\` to see available agents.`)
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }
    }

    // Get agent response
    const response = await this.getAgentResponse(agentId, message);
    
    if (response.success) {
      const agent = await this.getAgent(agentId);
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({ 
          name: agent.name,
          iconURL: this.getAgentAvatar(agent)
        })
        .setDescription(this.truncateMessage(response.message))
        .setFooter({ text: `Agent ID: ${agentId} | ${agent.category}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Error')
        .setDescription(response.error || 'Failed to get agent response')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    }
  }

  async handleAgentsCommand(interaction) {
    await interaction.deferReply();
    
    const search = interaction.options.getString('search');
    const agents = await this.getAgents(search);
    
    if (agents.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('No Agents Found')
        .setDescription(search ? `No agents found matching: "${search}"` : 'No agents available')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Group agents by category
    const categories = {};
    agents.forEach(agent => {
      if (!categories[agent.category]) {
        categories[agent.category] = [];
      }
      categories[agent.category].push(agent);
    });

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Available ShareBrain Agents')
      .setDescription(`Found ${agents.length} agents${search ? ` matching "${search}"` : ''}`)
      .setTimestamp();

    // Add fields for each category
    Object.entries(categories).forEach(([category, categoryAgents]) => {
      const agentList = categoryAgents
        .slice(0, 5) // Limit to 5 agents per category
        .map(agent => `**${agent.name}** (ID: ${agent.id})\n${agent.description || 'No description'}`)
        .join('\n\n');
      
      embed.addFields({
        name: `${category} (${categoryAgents.length})`,
        value: agentList || 'No agents in this category',
        inline: false
      });
    });

    embed.setFooter({ text: 'Use /chat agent:"agent name" to chat with a specific agent' });
    
    await interaction.editReply({ embeds: [embed] });
  }

  async handleSwitchCommand(interaction) {
    const agentParam = interaction.options.getString('agent');
    const agent = await this.findAgent(agentParam);
    
    if (!agent) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Agent Not Found')
        .setDescription(`Could not find agent: "${agentParam}". Use \`/agents\` to see available agents.`)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Set as default agent for this user
    this.userAgents.set(interaction.user.id, agent.id);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Agent Switched')
      .setDescription(`Now using **${agent.name}** as your default agent`)
      .addFields(
        { name: 'Category', value: agent.category, inline: true },
        { name: 'Agent ID', value: agent.id.toString(), inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }

  async handleCurrentCommand(interaction) {
    const agentId = this.getCurrentAgentId(interaction.user.id, interaction.channel.id);
    const agent = await this.getAgent(agentId);
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Current Agent')
      .setAuthor({ 
        name: agent.name,
        iconURL: this.getAgentAvatar(agent)
      })
      .setDescription(agent.description || 'No description available')
      .addFields(
        { name: 'Category', value: agent.category, inline: true },
        { name: 'Agent ID', value: agent.id.toString(), inline: true },
        { name: 'Status', value: agent.status || 'active', inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }

  async handleHelpCommand(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🧠 ShareBrain Discord Bot Help')
      .setDescription('Access all ShareBrain AI agents directly from Discord!')
      .addFields(
        {
          name: '💬 Chat Commands',
          value: [
            '`/chat message:"your message"` - Chat with current agent',
            '`/chat message:"hello" agent:"agent name"` - Chat with specific agent',
            '`@ShareBrain your message` - Direct message the bot'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔧 Agent Management',
          value: [
            '`/agents` - List all available agents',
            '`/agents search:"keyword"` - Search agents',
            '`/switch agent:"agent name"` - Set default agent',
            '`/current` - Show current active agent'
          ].join('\n'),
          inline: false
        },
        {
          name: '📋 Features',
          value: [
            '• 180+ AI agents available',
            '• Personal agent preferences',
            '• Rich embedded responses',
            '• Category-based organization',
            '• Real-time agent switching'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'Powered by ShareBrain AI Platform' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }

  async handleDirectMessage(message, content) {
    const agentId = this.getCurrentAgentId(message.author.id, message.channel.id);
    const response = await this.getAgentResponse(agentId, content);
    
    if (response.success) {
      const agent = await this.getAgent(agentId);
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({ 
          name: agent.name,
          iconURL: this.getAgentAvatar(agent)
        })
        .setDescription(this.truncateMessage(response.message))
        .setFooter({ text: `Agent ID: ${agentId} | Use /switch to change agents` })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply('❌ Sorry, I encountered an error processing your message. Please try again.');
    }
  }

  // API Methods
  async getAgents(search = '') {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/agents`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: search ? { search } : {}
      });
      
      return response.data.agents || response.data || [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  async getAgent(agentId) {
    if (this.agentCache.has(agentId)) {
      return this.agentCache.get(agentId);
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/agents/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const agent = response.data;
      this.agentCache.set(agentId, agent);
      return agent;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return {
        id: agentId,
        name: 'Unknown Agent',
        category: 'Unknown',
        description: 'Agent information unavailable'
      };
    }
  }

  async findAgent(query) {
    const agents = await this.getAgents();
    
    // Try exact ID match first
    if (!isNaN(query)) {
      const agent = agents.find(a => a.id === parseInt(query));
      if (agent) return agent;
    }
    
    // Try exact name match
    const exactMatch = agents.find(a => 
      a.name.toLowerCase() === query.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Try partial name match
    const partialMatch = agents.find(a => 
      a.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return partialMatch || null;
  }

  async getAgentResponse(agentId, message) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/v1/agents/${agentId}/completions`, {
        messages: [
          { role: 'user', content: message }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        message: response.data.choices[0].message.content || response.data.message || 'No response'
      };
    } catch (error) {
      console.error('Error getting agent response:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get agent response'
      };
    }
  }

  async loadAgentCache() {
    console.log('Loading agent cache...');
    const agents = await this.getAgents();
    agents.forEach(agent => {
      this.agentCache.set(agent.id, agent);
    });
    console.log(`Cached ${agents.length} agents`);
  }

  // Utility Methods
  getCurrentAgentId(userId, channelId) {
    return this.userAgents.get(userId) || 
           this.channelAgents.get(channelId) || 
           parseInt(this.defaultAgentId);
  }

  getAgentAvatar(agent) {
    // Generate avatar based on agent name or use default
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0099ff&color=fff&size=64`;
  }

  truncateMessage(message) {
    if (message.length <= this.maxMessageLength) {
      return message;
    }
    return message.substring(0, this.maxMessageLength - 3) + '...';
  }

  async start() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN is required');
      process.exit(1);
    }

    if (!process.env.DISCORD_CLIENT_ID) {
      console.error('DISCORD_CLIENT_ID is required');
      process.exit(1);
    }

    if (!this.apiKey) {
      console.error('SHAREBRAIN_API_KEY is required');
      process.exit(1);
    }

    await this.client.login(process.env.DISCORD_BOT_TOKEN);
  }
}

// Start the bot
const bot = new ShareBrainDiscordBot();
bot.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down ShareBrain Discord Bot...');
  bot.client.destroy();
  process.exit(0);
});