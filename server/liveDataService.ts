import { WebSearchService } from './webSearch';

export interface LiveDataConfig {
  webSearchEnabled: boolean;
  apiIntegrations: string[];
  dataRefreshInterval: number; // minutes
}

export class LiveDataService {
  /**
   * Enhance agent response with live data from web search
   */
  static async enhanceWithWebSearch(
    systemPrompt: string,
    userMessage: string,
    modelName: string = "llama-3.1-70b-versatile"
  ): Promise<string> {
    try {
      // Detect if user query requires current information
      if (this.requiresCurrentInfo(userMessage)) {
        console.log(`Searching for current information: ${userMessage}`);
        
        // Perform web search
        const searchResults = await WebSearchService.search(userMessage);
        
        // Add current information to system prompt
        const enhancedPrompt = `${systemPrompt}

CURRENT INFORMATION (from web search):
${searchResults}

Use this current information to provide up-to-date responses. If the current information is relevant to the user's query, prioritize it over your training data.`;

        return enhancedPrompt;
      }
      
      return systemPrompt;
    } catch (error) {
      console.error('Web search failed:', error);
      return systemPrompt; // Fall back to original prompt
    }
  }

  /**
   * Check if user message requires current information
   */
  private static requiresCurrentInfo(message: string): boolean {
    const currentInfoKeywords = [
      'current', 'latest', 'recent', 'today', 'now', 'this week', 'this month',
      'news', 'breaking', 'update', 'happening', 'price', 'stock', 'weather',
      'events', 'what\'s', 'whats', 'trending', 'live', 'real-time'
    ];
    
    const messageWords = message.toLowerCase().split(' ');
    return currentInfoKeywords.some(keyword => 
      messageWords.some(word => word.includes(keyword))
    );
  }

  /**
   * Get live financial data (example implementation)
   */
  static async getFinancialData(symbol: string): Promise<string> {
    // This would integrate with a financial API
    // For now, return a placeholder that suggests web search
    return `For current ${symbol} stock price, searching latest financial data...`;
  }

  /**
   * Get live weather data (example implementation)
   */
  static async getWeatherData(location: string): Promise<string> {
    // This would integrate with a weather API
    // For now, return a placeholder that suggests web search
    return `For current weather in ${location}, searching latest weather data...`;
  }

  /**
   * Get live news data (example implementation)
   */
  static async getNewsData(query: string): Promise<string> {
    // This would integrate with news APIs
    // For now, return a placeholder that suggests web search
    return `For current news about ${query}, searching latest news sources...`;
  }

  /**
   * Create enhanced system prompt for agents with live data capabilities
   */
  static createLiveDataSystemPrompt(
    basePrompt: string,
    dataTypes: string[] = ['news', 'weather', 'financial']
  ): string {
    const liveDataCapabilities = dataTypes.map(type => {
      switch (type) {
        case 'news':
          return '- Current news and breaking stories from reliable sources';
        case 'weather':
          return '- Real-time weather conditions and forecasts';
        case 'financial':
          return '- Live stock prices and market data';
        case 'sports':
          return '- Live sports scores and game updates';
        default:
          return `- Live ${type} data and updates`;
      }
    }).join('\n');

    return `${basePrompt}

LIVE DATA CAPABILITIES:
You have access to current information through web search when users ask for:
${liveDataCapabilities}

When users request current information, you will receive up-to-date data to supplement your responses. Always indicate when you're using current information vs. your training data.`;
  }
}

// Example usage for different agent types
export const LiveDataAgentTemplates = {
  newsAgent: {
    systemPrompt: LiveDataService.createLiveDataSystemPrompt(
      "You are a professional news analyst who provides current, accurate information about world events.",
      ['news']
    ),
    webSearchEnabled: true,
    apiIntegrations: ['newsapi', 'reuters'],
    dataRefreshInterval: 60 // 1 hour
  },

  weatherAgent: {
    systemPrompt: LiveDataService.createLiveDataSystemPrompt(
      "You are a weather expert who provides current conditions and forecasts.",
      ['weather']
    ),
    webSearchEnabled: true,
    apiIntegrations: ['openweathermap'],
    dataRefreshInterval: 60 // 1 hour
  },

  financialAgent: {
    systemPrompt: LiveDataService.createLiveDataSystemPrompt(
      "You are a financial advisor who provides current market data and analysis.",
      ['financial']
    ),
    webSearchEnabled: true,
    apiIntegrations: ['alphavantage', 'yahoo-finance'],
    dataRefreshInterval: 15 // 15 minutes
  }
};