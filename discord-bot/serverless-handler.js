const { Client, GatewayIntentBits } = require('discord.js');

let client;

const handler = async (event, context) => {
  // For scheduled events (keep-alive)
  if (event.source === 'aws.events') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Keep-alive ping' })
    };
  }

  // Initialize client if not already done
  if (!client) {
    // Import and initialize your bot
    const ShareBrainBot = require('./index');
    // Bot will auto-start
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Bot initialized' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Bot is running' })
  };
};

module.exports = { handler };