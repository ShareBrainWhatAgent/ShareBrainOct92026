require('dotenv').config();

console.log('🔍 Environment Variables Debug:');
console.log('DISCORD_BOT_TOKEN length:', process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN.length : 'undefined');
console.log('DISCORD_BOT_TOKEN starts with:', process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN.substring(0, 20) + '...' : 'undefined');
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
console.log('DISCORD_CLIENT_ID length:', process.env.DISCORD_CLIENT_ID ? process.env.DISCORD_CLIENT_ID.length : 'undefined');
console.log('SHAREBRAIN_API_KEY length:', process.env.SHAREBRAIN_API_KEY ? process.env.SHAREBRAIN_API_KEY.length : 'undefined');
console.log('SHAREBRAIN_API_BASE_URL:', process.env.SHAREBRAIN_API_BASE_URL);