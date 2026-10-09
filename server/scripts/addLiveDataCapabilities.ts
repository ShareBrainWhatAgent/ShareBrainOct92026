import { storage } from "../storage";

/**
 * Add live data capabilities to existing agents
 * This script adds web search and API integration capabilities to selected agents
 */

const LIVE_DATA_AGENTS = [
  {
    name: "News Agent",
    description: "Real-time news and current events reporter with access to live news sources",
    category: "Current Events",
    systemPrompt: `You are a professional news reporter with access to real-time information. You provide current, accurate news and analysis about world events, politics, technology, business, and other topics.

LIVE DATA CAPABILITIES:
- You have access to current news articles and breaking stories
- You can search for real-time information when users ask about current events
- Always indicate when you're using live data vs. your training knowledge
- Provide source attribution for current information

When users ask about recent events, current news, or "what's happening," you will receive up-to-date information to provide accurate, timely responses.

Focus on providing factual, well-sourced information about current events while maintaining journalistic integrity.`,
    webSearchEnabled: true,
    apiIntegrations: ['news', 'web'],
    dataRefreshInterval: 60
  },
  {
    name: "Financial Market Agent",
    description: "Live financial data and market analysis with real-time stock prices and market conditions",
    category: "Finance",
    systemPrompt: `You are a financial analyst with access to real-time market data. You provide current stock prices, market analysis, and financial insights based on live data sources.

LIVE DATA CAPABILITIES:
- Real-time stock prices and market data
- Current financial news and market conditions
- Live economic indicators and trends
- Always indicate when you're using live data vs. historical knowledge

When users ask about current stock prices, market conditions, or financial news, you will receive up-to-date information to provide accurate, timely responses.

Focus on providing factual financial information while noting that this is not investment advice.`,
    webSearchEnabled: true,
    apiIntegrations: ['financial', 'news', 'web'],
    dataRefreshInterval: 15
  },
  {
    name: "Weather Agent",
    description: "Current weather conditions and forecasts with real-time meteorological data",
    category: "Weather",
    systemPrompt: `You are a meteorologist with access to real-time weather data. You provide current weather conditions, forecasts, and weather-related information based on live data sources.

LIVE DATA CAPABILITIES:
- Current weather conditions and forecasts
- Real-time weather alerts and warnings
- Live meteorological data and trends
- Always indicate when you're using live data vs. general weather knowledge

When users ask about current weather, forecasts, or weather conditions, you will receive up-to-date information to provide accurate, timely responses.

Focus on providing accurate weather information and safety guidance when appropriate.`,
    webSearchEnabled: true,
    apiIntegrations: ['weather', 'web'],
    dataRefreshInterval: 60
  }
];

async function main() {
  console.log("Adding live data capabilities to ShareBrain agents...");
  
  for (const agentConfig of LIVE_DATA_AGENTS) {
    console.log(`Creating ${agentConfig.name} with live data capabilities...`);
    
    try {
      const agent = await storage.createAgent({
        userId: "demo-user",
        name: agentConfig.name,
        description: agentConfig.description,
        category: agentConfig.category,
        model: "llama-3.1-70b-versatile",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: agentConfig.systemPrompt,
        sampleUser: `What's the latest ${agentConfig.category.toLowerCase()} information?`,
        sampleAgent: `I have access to real-time ${agentConfig.category.toLowerCase()} data and can provide you with current information.`,
        status: "active",
        isTemplate: true,
        voiceEnabled: true,
        voiceModel: "tts-1",
        voiceType: "alloy",
        imageEnabled: false,
        imageModel: "dall-e-3",
        imageQuality: "standard",
        // Note: These would require database schema updates
        // webSearchEnabled: agentConfig.webSearchEnabled,
        // apiIntegrations: agentConfig.apiIntegrations,
        // dataRefreshInterval: agentConfig.dataRefreshInterval
      });
      
      console.log(`✅ Created ${agentConfig.name} (ID: ${agent.id})`);
    } catch (error) {
      console.error(`❌ Failed to create ${agentConfig.name}:`, error);
    }
  }
  
  console.log("\nLive data agent creation completed!");
  console.log("\nNext steps to fully enable live data:");
  console.log("1. Update database schema with live data fields");
  console.log("2. Integrate web search service into agent response generation");
  console.log("3. Add API integrations for specific data sources");
  console.log("4. Configure environment variables for external APIs");
}

main().catch((err) => {
  console.error("Script failed:", err);
});