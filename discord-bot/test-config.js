const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

console.log('🧪 Testing ShareBrain Discord Bot Configuration...\n');

// Test 1: Check environment variables
console.log('1. Environment Variables:');
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID', 
  'SHAREBRAIN_API_BASE_URL',
  'SHAREBRAIN_API_KEY'
];

const missingVars = [];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('paste_your_') || value.includes('_here')) {
    missingVars.push(varName);
    console.log(`   ❌ ${varName}: Missing or placeholder`);
  } else {
    console.log(`   ✅ ${varName}: Configured`);
  }
});

// Test 2: Check bot token format
console.log('\n2. Discord Bot Token Format:');
const botToken = process.env.DISCORD_BOT_TOKEN;
if (botToken && !botToken.includes('paste_your_') && botToken.length > 50) {
  console.log('   ✅ Token format appears valid');
} else {
  console.log('   ❌ Token format invalid or missing');
}

// Test 3: Check client ID format
console.log('\n3. Discord Client ID Format:');
const clientId = process.env.DISCORD_CLIENT_ID;
if (clientId && !clientId.includes('paste_your_') && /^\d{17,19}$/.test(clientId)) {
  console.log('   ✅ Client ID format appears valid');
} else {
  console.log('   ❌ Client ID format invalid or missing');
}

// Test 4: Test ShareBrain API connectivity
console.log('\n4. ShareBrain API Connectivity:');
async function testApi() {
  try {
    const response = await axios.get(`${process.env.SHAREBRAIN_API_BASE_URL}/api/v1/agents`, {
      headers: {
        'Authorization': `Bearer ${process.env.SHAREBRAIN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.length > 0) {
      console.log(`   ✅ API connection successful - ${response.data.length} agents found`);
      console.log(`   📋 Sample agents: ${response.data.slice(0, 3).map(a => a.name).join(', ')}`);
    } else {
      console.log('   ⚠️  API connected but no agents returned');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ❌ API authentication failed - check SHAREBRAIN_API_KEY');
    } else {
      console.log(`   ❌ API connection failed: ${error.message}`);
    }
  }
}

// Test 5: Check required files
console.log('\n5. Required Files:');
const requiredFiles = ['index.js', 'package.json', '.env'];
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}: Found`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

// Run async test
testApi().then(() => {
  console.log('\n🎯 Configuration Summary:');
  if (missingVars.length > 0) {
    console.log('   ❌ Configuration incomplete');
    console.log('   📝 Missing variables:', missingVars.join(', '));
    console.log('   🔧 Please update your .env file or Replit Secrets');
  } else {
    console.log('   ✅ Configuration looks good!');
    console.log('   🚀 Ready to start bot with: npm start');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Ensure all environment variables are set correctly');
  console.log('   2. Invite bot to Discord server using OAuth2 URL');
  console.log('   3. Test bot commands: /help, /agents, /chat');
  console.log('   4. Monitor console for any startup errors');
});